﻿/// <reference path="botbuilder.d.ts" />

declare var cytoscape: any;

module VORLON {
    export class BotFrameworkInspectorDashboard extends DashboardPlugin {
        constructor() {
            super("botFrameworkInspector", "control.html", "control.css");
            this._ready = false;
            this._id = "BOTFRAMEWORKINSPECTOR";
        }

        private _lastReceivedBotInfo: BotInfo;
        private _dialogsContainer: HTMLDivElement;
        private _dialogStacksContainer: HTMLDivElement;
        private _divPluginBot: HTMLDivElement;

        public startDashboardSide(div: HTMLDivElement = null): void {
            this._insertHtmlContentAsync(div, (filledDiv) => {
                this._dialogsContainer = <HTMLDivElement>document.getElementById("dialogs");
                this._dialogStacksContainer = <HTMLDivElement>document.getElementById("dialogstacks");

                var firstInitialization = () => {
                    if (!this._ready && this._divPluginBot.style.display === "none") {
                        window.setTimeout(firstInitialization, 500);
                    }
                    else {
                        this._ready = true;
                        this.display();
                        this._drawGraphNodes();
                    }   
                };

                this._loadScript("/vorlon/plugins/botFrameworkInspector/cytoscape.min.js", () => {
                    this._loadScript("/vorlon/plugins/botFrameworkInspector/dagre.min.js", () => {
                        this._loadScript("/vorlon/plugins/botFrameworkInspector/cytoscape-dagre.js", () => {
                            this._divPluginBot = <HTMLDivElement>document.getElementsByClassName("plugin-botframeworkinspector")[0];
                            window.setTimeout(firstInitialization, 500);
                        });
                    });
                });
            });
        }

        private _drawGraphNodes() {
             if (this._lastReceivedBotInfo) {
                var nodesList = [];
                this._lastReceivedBotInfo.dialogDataList.forEach((dataList) => {
                    nodesList.push({data: { id: nodesList.length, value: dataList.id}});

                     if (dataList.dialog && dataList.dialog.length) {
                        if(dataList.dialog.length > 0){
                            for(var i = 0; i < dataList.dialog.length; i++){
                                nodesList.push({data: { id: nodesList.length, value: dataList.id + '/' + 'Step' + (i + 1)}});
                            }
                        }
                    }
                });

                console.log(nodesList);
             }

            var cy = cytoscape({
            container: <HTMLElement>document.getElementById('right'),
            boxSelectionEnabled: false,
            autounselectify: true,
            layout: {
                name: 'dagre'
            },
            style: [
                {
                selector: 'node',
                style: {
                    'content': 'data(value)',
                    'text-opacity': 0.5,
                    'text-valign': 'center',
                    'text-halign': 'right',
                    'background-color': '#11479e'
                }
                },
                {
                selector: 'edge',
                style: {
                        'width': 2,
                        'target-arrow-shape': 'triangle',
                        'line-color': '#9dbaea',
                        'target-arrow-color': '#9dbaea',
                        'curve-style': 'bezier'
                    }
                }
            ],
            elements: {
                nodes: nodesList,
                edges: [
                    // { data: { source: 'n0', target: 'n1' } },
                    // { data: { source: 'n0', target: 'n2' } },
                    // { data: { source: 'n1', target: 'n3' } },
                    // { data: { source: 'n1', target: 'n4' } },
                    // { data: { source: 'n3', target: 'n1' } },
                    // { data: { source: 'n2', target: 'n5' } },
                    // { data: { source: 'n2', target: 'n6' } },
                    // { data: { source: 'n6', target: 'n7' } }
                ]
                },
            });
            cy.on('tap', 'node', function(event){
                var evtTarget = event.cyTarget;
                console.log(evtTarget.id());
            });
        }

        private _loadScript(url, callback) {
            var script = document.createElement("script");
            script.type = "text/javascript";

            script.onload = function () {
                callback();
            };

            script.src = url;
            document.getElementsByTagName("head")[0].appendChild(script);
        }

        public onRealtimeMessageReceivedFromClientSide(receivedObject: any): void {
            this._lastReceivedBotInfo = receivedObject;
            this.display();
            this._drawGraphNodes();
        }

        public display() {
            if (this._lastReceivedBotInfo) {

                this._dialogsContainer.innerHTML = null;
                this._lastReceivedBotInfo.dialogDataList.forEach((dataList) => {
                    var dialog = document.createElement("div");
                    dialog.classList.add("dialog");
                    
                    var dialogid = document.createElement("p");
                    dialogid.innerText = `${dataList.library} > ${dataList.id}`;
                    dialogid.classList.add("dialog-id");
                    dialog.appendChild(dialogid);

                    var dialogDetail = document.createElement("div");
                    dialogDetail.classList.add("dialog-detail");
                    dialog.appendChild(dialogDetail);

                    var waterfallStepsLabel = document.createElement("p");
                    waterfallStepsLabel.innerText = "Waterfall steps : ";
                    dialogDetail.appendChild(waterfallStepsLabel);

                    var waterfallSteps = document.createElement("div");
                    waterfallSteps.classList.add("waterfall-steps");
                    dialogDetail.appendChild(waterfallSteps);

                     if (dataList.dialog && dataList.dialog.length) {
                        if(dataList.dialog.length > 0){
                            for(var i = 0; i < dataList.dialog.length; i++){
                                var waterfallStep = document.createElement("div");
                                waterfallStep.classList.add("waterfall-step");
                                waterfallStep.innerText = (i + 1).toString();
                                waterfallSteps.appendChild(waterfallStep);
                            }
                        }
                        else {
                            waterfallStepsLabel.innerText += " none.";
                        }
                    }
                    else {
                        waterfallStepsLabel.innerText += " none.";
                    }

                    this._dialogsContainer.appendChild(dialog);
                });

                if(this._lastReceivedBotInfo.userEntries && this._lastReceivedBotInfo.userEntries.length){
                    this._dialogStacksContainer.innerHTML = null;
                    this._lastReceivedBotInfo.userEntries.forEach((botUserEntry) => {
                        var userEntry = document.createElement("div");
                        userEntry.classList.add("user-entry");
                        
                        var entry = document.createElement("p");
                        entry.classList.add("entry");
                        entry.innerHTML = "<strong>User entry:</strong> " + botUserEntry.message.text;
                        userEntry.appendChild(entry);

                        var stacks = document.createElement("div");
                        stacks.classList.add("stacks");
                        userEntry.appendChild(stacks);

                        //loop on each stack: one for now
                        botUserEntry.dialogStacks.forEach((dialogSessionInfo) => {
                            var stack = document.createElement("div");
                            stack.classList.add("stack");
                            stacks.appendChild(stack);

                            var dialogsInStack = document.createElement("div");
                            dialogsInStack.classList.add("dialogs-in-stack");
                            stack.appendChild(dialogsInStack);

                            if(dialogSessionInfo.sessionState.callstack && dialogSessionInfo.sessionState.callstack.length > 0){
                                var lineSeparator:HTMLDivElement;

                                //loop on each dialog in the stack
                                dialogSessionInfo.sessionState.callstack.forEach((dialog) => {
                                    var dialogInStack = document.createElement("div");
                                    dialogInStack.classList.add("dialog-in-stack");
                                    dialogInStack.innerText = dialog.id;
                                    if(dialog.state["BotBuilder.Data.WaterfallStep"] != undefined)
                                        dialogInStack.innerText += " (" + dialog.state["BotBuilder.Data.WaterfallStep"] + ")";
                                    dialogsInStack.appendChild(dialogInStack);

                                    lineSeparator = document.createElement("div");
                                    lineSeparator.classList.add("line");
                                    dialogsInStack.appendChild(lineSeparator);
                                });
                            }
                            else {
                                dialogsInStack.innerText = "(No dialog in stack)";
                                lineSeparator = document.createElement("div");
                                lineSeparator.classList.add("line");
                                dialogsInStack.appendChild(lineSeparator);
                            }

                            var eventType = document.createElement("p");
                            eventType.innerText = `[${EventType[dialogSessionInfo.eventType]}`
                            if(dialogSessionInfo.impactedDialogId) 
                                eventType.innerText += `(${dialogSessionInfo.impactedDialogId})]`;
                            else
                                eventType.innerText += "]";
                            dialogsInStack.appendChild(eventType);

                            console.log(botUserEntry.message);

                            var userData = document.createElement("div");
                            userData.classList.add("data");
                            userData.innerHTML = "<p><strong>ConversationData:</strong> " + JSON.stringify(dialogSessionInfo.conversationData) + "</p>";
                            userData.innerHTML += "<p><strong>DialogData:</strong> " + JSON.stringify(dialogSessionInfo.dialogData) + "</p>";
                            userData.innerHTML += "<p><strong>PrivateConversationData:</strong> " + JSON.stringify(dialogSessionInfo.privateConversationData) + "</p>";
                            userData.innerHTML += "<p><strong>UserData:</strong> " + JSON.stringify(dialogSessionInfo.userData) + "</p>";
                            stack.appendChild(userData);
                        });

                        this._dialogStacksContainer.appendChild(userEntry);
                    });
                }
            }
        }
    }

    //Register the plugin with vorlon core 
    Core.RegisterDashboardPlugin(new BotFrameworkInspectorDashboard());
}

interface Window {
    flowchart: FlowChart;
}

interface FlowChart {
    parse(code: string): any;
};