import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import ts = require("typescript");

export function parseCodeExtensions(pathToMainTs: string) {

  const definedActions: string[] = []
  if (existsSync(pathToMainTs)) {
    const unitMainTs = ts.createSourceFile(
      pathToMainTs,
      readFileSync(pathToMainTs).toString(),
      ts.ScriptTarget.ESNext,
      true
    )

    let defaultExportNode: ts.Node
    let exportedObject: ts.ObjectLiteralExpression
    const findDefaultExport = function (node: ts.Node) {
      if (node.kind === ts.SyntaxKind.ExportAssignment) {
        defaultExportNode = node
        const findExportedObject = function (node: ts.Node) {
          switch (node.kind) {
            case ts.SyntaxKind.CallExpression:
              {
                const call = node as ts.CallExpression
                const functionName = call.expression as ts.Identifier
                if (functionName.escapedText === 'defineUnitOptions') {
                  const arg = call.arguments[0]
                  if (arg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                    exportedObject = arg as ts.ObjectLiteralExpression
                    return
                  } else {
                    throw 'unexpected argument for defineUnitOptions'
                  }
                } else {
                  throw 'unexpected function call in default-export - only defineUnitOptions is supported'
                }
              }
            case ts.SyntaxKind.ObjectLiteralExpression:
              exportedObject = node as ts.ObjectLiteralExpression
              return
          }
        }
        ts.forEachChild(node, findExportedObject)
      } else {
        ts.forEachChild(node, findDefaultExport)
      }
    }
    findDefaultExport(unitMainTs)

    if (exportedObject) {
      const actionProperty = exportedObject.properties.find((p: any) => p.name.getText() === 'actions') as ts.ObjectLiteralElementLike | undefined
      if (actionProperty) {
        actionProperty.forEachChild((n: any) => {
          if (n.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            definedActions.push(...(n as ts.ObjectLiteralExpression).properties.map((p: any) => p.name.getText()))
          }
        })
      }
    }
  }

  return definedActions

}