exports.activate = function() {
    var runOn;
    if (String(nova.config.get('works.creativecode.pylint.runOn')) == "File Change") {
        runOn = {event: "onChange"};
    } else {
        runOn = {event: "onSave"};
    }
    nova.assistants.registerIssueAssistant("python", new IssueAssistant(), runOn);
}

exports.deactivate = function() {
}

function pylintParser(editor, args) {
    return new Promise(function(resolve) {
        
        const path = nova.config.get('works.creativecode.pylint.path');
        
        // Issues and their mappings
        
        var issueSeverities = [nova.config.get('works.creativecode.pylint.fatalIS'), nova.config.get('works.creativecode.pylint.errorIS'), nova.config.get('works.creativecode.pylint.warningIS'), nova.config.get('works.creativecode.pylint.refactorIS'), nova.config.get('works.creativecode.pylint.conventionIS')]
        
        const version = nova.version;
        const below13 = version[0] == 1 && version[1] < 3;

        // Append document to arguments
        args.push(editor.document.path);
        console.log(`PyLint args: ${args}`);
        try {
            let process = new Process(path, {
                args: args,
                cwd: nova.workspace.path
            });
            
            let fatalParser = new IssueParser('fatal');
            let errorParser = new IssueParser('error');
            let warningParser = new IssueParser('warning');
            let refactorParser = new IssueParser('refactor');
            let conventionParser = new IssueParser('convention');

            process.onStdout((line) => {
                for (parser of [fatalParser, errorParser, warningParser, refactorParser, conventionParser]) {
                    parser.pushLine(line);
                }
            });
            process.onStderr((line) => { console.warn(`ERROR with message: ${line}`); });
            process.onDidExit((code) => {
                var allIssues = []
                var issueParserIssues = [fatalParser.issues, errorParser.issues, warningParser.issues, refactorParser.issues, conventionParser.issues];
                issueParserIssues.forEach((issues, index) => {
                    for (issue of issues) {
                        // Nice catch :) https://github.com/CasperCL/Python-Lint.novaextension
                        if(below13) {
                            issue.line += 1;
                        }
                        //
                        switch (String(issueSeverities[index])) {
                            case "Error":
                                issue.severity = IssueSeverity.Error;
                                break;
                            case "Warning":
                                issue.severity = IssueSeverity.Warning;
                                break;
                            case "Hint":
                                issue.severity = IssueSeverity.Hint;
                                break;
                            case "Info":
                                issue.severity = IssueSeverity.Info;
                                break;
                            case "Ignore":
                                break;
                        }
                        console.log(`${issueSeverities[index]} (${issue.line}, ${issue.column}): ${issue.message}`)
                        if (String(issueSeverities[index]) !== "Ignore") {
                            allIssues.push(issue);
                        }
                    }
                });
                resolve(allIssues);
                return;
            });
            process.start();
        } catch (err) {
            console.error(`PyLint ERROR: ${err}`);
            resolve([]);
            return;
        }
    });
}


class IssueAssistant {
    provideIssues(editor) {
        if (!nova.config.get('works.creativecode.pylint.enabled')) {
            return [];
        }
        var argumentString = nova.config.get('works.creativecode.pylint.args');
        var spacedArgumentString;
        if (argumentString === null) {
            if (nova.config.get('works.creativecode.pylint.useMinimalArgs')) {
                console.log("PyLint Using minimal argument list");
                // Default argument list as followed in VSCode Python. For information see: https://github.com/microsoft/vscode-python/blob/ed3f29f261100190f0dc1bea10ddf85f5b82e8d1/src/client/linters/pylint.ts
                spacedArgumentString = ['--disable=all',"--enable=F,unreachable,duplicate-key,unnecessary-semicolon,global-variable-not-assigned,unused-variable,unused-wildcard-import,binary-op-exception,bad-format-string,anomalous-backslash-in-string,bad-open-mode,E0001,E0011,E0012,E0100,E0101,E0102,E0103,E0104,E0105,E0107,E0108,E0110,E0111,E0112,E0113,E0114,E0115,E0116,E0117,E0118,E0202,E0203,E0211,E0213,E0236,E0237,E0238,E0239,E0240,E0241,E0301,E0302,E0303,E0401,E0402,E0601,E0602,E0603,E0604,E0611,E0632,E0633,E0701,E0702,E0703,E0704,E0710,E0711,E0712,E1003,E1101,E1102,E1111,E1120,E1121,E1123,E1124,E1125,E1126,E1127,E1128,E1129,E1130,E1131,E1132,E1133,E1134,E1135,E1136,E1137,E1138,E1139,E1200,E1201,E1205,E1206,E1300,E1301,E1302,E1303,E1304,E1305,E1306,E1310,E1700,E1701"];
            } else {
                spacedArgumentString = [];
            }
        } else {
            spacedArgumentString = argumentString.split(' ');
        }
        return pylintParser(editor, spacedArgumentString);
    }
}
