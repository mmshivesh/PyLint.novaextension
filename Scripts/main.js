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
        if (!nova.config.get('works.creativecode.pylint.enabled')) {
            resolve([]);
            return;
        }
        
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
                        // Thanks to https://github.com/CasperCL/Python-Lint.novaextension
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
                        console.log(`${issueSeverities[index]} at l:${issue.line},c:${issue.column}  ${issue.message}`)
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
        var argumentString = nova.config.get('works.creativecode.pylint.args');
        var spacedArgumentString;
        if (argumentString === null) {
            spacedArgumentString = [];
        } else {
            spacedArgumentString = argumentString.split(' ');
        }
        return pylintParser(editor, spacedArgumentString);
    }
}
