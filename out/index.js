"use strict";
exports.__esModule = true;
exports.parseCodeExtensions = void 0;
var fs_1 = require("fs");
var ts = require("typescript");
function parseCodeExtensions(pathToMainTs) {
    var definedActions = [];
    if ((0, fs_1.existsSync)(pathToMainTs)) {
        var unitMainTs = ts.createSourceFile(pathToMainTs, (0, fs_1.readFileSync)(pathToMainTs).toString(), ts.ScriptTarget.ESNext, true);
        var defaultExportNode_1;
        var exportedObject_1 = undefined;
        var findDefaultExport_1 = function (node) {
            if (node.kind === ts.SyntaxKind.ExportAssignment) {
                defaultExportNode_1 = node;
                var findExportedObject = function (node) {
                    switch (node.kind) {
                        case ts.SyntaxKind.CallExpression:
                            {
                                var call = node;
                                var functionName = call.expression;
                                if (functionName.escapedText === 'defineUnitOptions') {
                                    var arg = call.arguments[0];
                                    if (arg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                                        exportedObject_1 = arg;
                                        return;
                                    }
                                    else {
                                        throw 'unexpected argument for defineUnitOptions';
                                    }
                                }
                                else {
                                    throw 'unexpected function call in default-export - only defineUnitOptions is supported';
                                }
                            }
                        case ts.SyntaxKind.ObjectLiteralExpression:
                            exportedObject_1 = node;
                            return;
                    }
                };
                ts.forEachChild(node, findExportedObject);
            }
            else {
                ts.forEachChild(node, findDefaultExport_1);
            }
        };
        findDefaultExport_1(unitMainTs);
        if (exportedObject_1) {
            var actionProperty = exportedObject_1.properties.find(function (p) { return p.name.getText() === 'actions'; });
            if (actionProperty) {
                actionProperty.forEachChild(function (n) {
                    if (n.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                        definedActions.push.apply(definedActions, n.properties.map(function (p) { return p.name.getText(); }));
                    }
                });
            }
        }
    }
    return definedActions;
}
exports.parseCodeExtensions = parseCodeExtensions;
