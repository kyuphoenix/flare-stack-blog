import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import ts from "typescript";
import { defineConfig, loadEnv, type Plugin } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { z } from "zod";
import packageJson from "./package.json";

import { themeNames, themes } from "./src/features/theme/registry";

const buildEnvSchema = z.object({
  THEME: z.enum(themeNames).catch("default"),
});

const PARAGLIDE_MESSAGES_IMPORT = "@/paraglide/messages";

function isParaglideMessagesImport(
  node: ts.Node,
): node is ts.ImportDeclaration {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === PARAGLIDE_MESSAGES_IMPORT
  );
}

function getScriptKind(id: string) {
  if (id.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (id.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (id.endsWith(".ts")) return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function bindingNameIncludesMessageNamespace(name: ts.BindingName): boolean {
  if (ts.isIdentifier(name)) return name.text === "m";

  return name.elements.some((element) => {
    if (ts.isOmittedExpression(element)) return false;
    return bindingNameIncludesMessageNamespace(element.name);
  });
}

function functionLikeShadowsMessageNamespace(node: ts.Node): boolean {
  return (
    ts.isFunctionLike(node) &&
    node.parameters.some((parameter) =>
      bindingNameIncludesMessageNamespace(parameter.name),
    )
  );
}

function isParaglideMessageNamespaceIdentifier(
  node: ts.Node,
): node is ts.Identifier {
  return ts.isIdentifier(node) && node.text === "m";
}

function isNamespacePropertyAccess(
  node: ts.Node,
): node is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(node) &&
    isParaglideMessageNamespaceIdentifier(node.expression)
  );
}

function isPropertyAccessNamespaceExpression(node: ts.Node) {
  return (
    isParaglideMessageNamespaceIdentifier(node) &&
    ts.isPropertyAccessExpression(node.parent) &&
    node.parent.expression === node
  );
}

function isImportSpecifierName(node: ts.Node) {
  return (
    isParaglideMessageNamespaceIdentifier(node) &&
    ts.isImportSpecifier(node.parent) &&
    node.parent.name === node
  );
}

function paraglideDirectMessageImports(): Plugin {
  return {
    name: "flare-stack:paraglide-direct-message-imports",
    enforce: "pre",
    transform(code, id) {
      const normalizedId = id.replaceAll("\\", "/");

      if (
        !normalizedId.includes("/src/") ||
        normalizedId.includes("/src/paraglide/") ||
        !/\.[cm]?[jt]sx?$/.test(normalizedId) ||
        !code.includes(PARAGLIDE_MESSAGES_IMPORT)
      ) {
        return null;
      }

      const sourceFile = ts.createSourceFile(
        id,
        code,
        ts.ScriptTarget.Latest,
        true,
        getScriptKind(id),
      );

      let importsMessageNamespace = false;
      const messageKeys = new Set<string>();
      let keepsMessageNamespace = false;

      function analyze(
        node: ts.Node,
        isMessageNamespaceShadowed = false,
      ): void {
        if (isParaglideMessagesImport(node)) {
          const namedBindings = node.importClause?.namedBindings;
          importsMessageNamespace =
            importsMessageNamespace ||
            (namedBindings !== undefined &&
              ts.isNamedImports(namedBindings) &&
              namedBindings.elements.some(
                (element) => element.name.text === "m",
              ));
          return;
        }

        const shadowed =
          isMessageNamespaceShadowed ||
          functionLikeShadowsMessageNamespace(node);

        if (!shadowed) {
          if (isNamespacePropertyAccess(node)) {
            messageKeys.add(node.name.text);
          } else if (
            isParaglideMessageNamespaceIdentifier(node) &&
            !isPropertyAccessNamespaceExpression(node) &&
            !isImportSpecifierName(node)
          ) {
            keepsMessageNamespace = true;
          }
        }

        ts.forEachChild(node, (child) => analyze(child, shadowed));
      }

      analyze(sourceFile);

      if (
        !importsMessageNamespace ||
        keepsMessageNamespace ||
        messageKeys.size === 0
      ) {
        return null;
      }

      const messageImports = [...messageKeys]
        .sort()
        .map(
          (key) =>
            `import { ${key} as _m_${key} } from "@/paraglide/messages";`,
        )
        .join("\n");

      const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        const visit: ts.Visitor = (node) => {
          if (isParaglideMessagesImport(node)) {
            const importClause = node.importClause;
            const namedBindings = importClause?.namedBindings;

            if (
              !namedBindings ||
              !ts.isNamedImports(namedBindings) ||
              !namedBindings.elements.some(
                (element) => element.name.text === "m",
              )
            ) {
              return node;
            }

            const remainingImports = namedBindings.elements.filter(
              (element) => element.name.text !== "m",
            );

            if (remainingImports.length === 0) return undefined;

            return ts.factory.updateImportDeclaration(
              node,
              node.modifiers,
              ts.factory.updateImportClause(
                importClause,
                importClause.isTypeOnly,
                importClause.name,
                ts.factory.updateNamedImports(namedBindings, remainingImports),
              ),
              node.moduleSpecifier,
              node.attributes,
            );
          }

          if (isNamespacePropertyAccess(node)) {
            return ts.factory.createIdentifier(`_m_${node.name.text}`);
          }

          return ts.visitEachChild(node, visit, context);
        };

        return (node) => ts.visitNode(node, visit) as ts.SourceFile;
      };

      const result = ts.transform(sourceFile, [transformer]);
      const transformed = result.transformed[0];
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      const transformedCode = printer.printFile(transformed);
      result.dispose();

      return {
        code: `${messageImports}\n${transformedCode}`,
        map: null,
      };
    },
  };
}

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const buildEnv = buildEnvSchema.parse(env);
  return {
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __THEME_NAME__: JSON.stringify(buildEnv.THEME),
      __THEME_CONFIG__: JSON.stringify(themes[buildEnv.THEME]),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@theme": path.resolve(
          __dirname,
          `src/features/theme/themes/${buildEnv.THEME}`,
        ),
      },
    },
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["cookie", "preferredLanguage", "baseLocale"],
        cookieName: "LOCALE",
      }),
      cloudflare({
        viteEnvironment: {
          name: "ssr",
        },
      }),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      devtools(),
      paraglideDirectMessageImports(),
      tanstackStart({
        importProtection: {
          enabled: false,
        },
      }),
      viteReact(),
    ],
  };
});

export default config;
