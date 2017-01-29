'use strict';

var MOVES = [
    'Right Foot, Red',
    'Right Foot, Yellow',
    'Right Foot, Green',
    'Right Foot, Blue',
    'Left Foot, Red',
    'Left Foot, Yellow',
    'Left Foot, Green',
    'Left Foot, Blue',
    'Right Hand, Red',
    'Right Hand, Yellow',
    'Right Hand, Green',
    'Right Hand, Blue',
    'Left Hand, Red',
    'Left Hand, Yellow',
    'Left Hand, Green',
    'Left hand, Blue'
];
var APP_ID = "amzn1.ask.skill.0f7de565-4ef6-4b94-9b72-dea554a9b93c";

exports.handler = function (event, context) {

    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        // Verify that application is coming from our skill
        if (event.session.application.applicationId !== APP_ID) {
            context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.requst.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }

    } catch (e) {
        context.fail("Exception: " + e);
    }

};

/**
 * Configure Requests
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // initialization logic
}

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getConfigurationResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);
    
    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // dispatch gameplay intents to handlers
    if ("ContinueIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getConfigurationResponse(callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("ChallengeRoundIntent" === intentName) {
        handleChallengeRoundRequest(intent, session, callback);
    }
}

/**
 * Skill Business Logic
 */
var CARD_TITLE = "Spinner for Twister";

function getConfigurationResponse(callback) {
    var sessionAttributes = {},
        speechOutput = "Welcome, now let's play some Twister!",
        shouldEndSession = false,
        currentTurn = 0,
        repromptText = "To hear the next move say, spin, to enter a challenge round simply say, challenge, to end the game say, stop, or, game over";
    
    speechOutput += repromptText;
    sessionAttributes = {
        "speechOutput": repromptText,
        "repromptText": repromptText,
        "currentTurn": currentTurn
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function populateMovesArray() {
    var movesArray = [];
    for (var i=0; i < 10; i++) {
        movesArray.push(randomMove());
    }
    return movesArray;
}

function randomMove() {
    return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function handleAnswerRequest(intent, session, callback) {
    var sessionAttributes = {};
    var currentTurn = parseInt(session.attributes.currentTurn) + 1;
    var speechOutput = "Turn " + session.attributes.currentTurn + ", ";
    var repromptText = randomMove();
    speechOutput += repromptText;

    sessionAttributes = {
        "currentTurn": currentTurn,
        "speechOutput": speechOutput,
        "repromptText": repromptText
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleChallengeRoundRequest(intent, session, callback) {
    var sessionAttributes = {};
    var movesArray = populateMovesArray();
    var speechOutput = "<speak>I will now shoot off 10 moves, giving you seconds between each move."
        + " If you all give up, simply say stop! Now I will begin, ";
    for (var i=0; i<movesArray.length; i++) {
        speechOutput += movesArray[i] + '<break time="1s"/>';
    }
    var currentTurn = parseInt(session.attributes.currentTurn) + 20;
    speechOutput += ". If you're still up, say spin again, or challenge for more pain!</speak>";
    var repromptText = "";
    sessionAttributes = {
        "currenTurn": currentTurn,
        "speechOutput": speechOutput,
        "repromptText": repromptText
    };
    callback(sessionAttributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, false, true));

}

function handleRepeatRequest(intent, session, callback) {
    if (!session.attributes || !session.attributes.speechOutput) {
        getConfigurationResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    var speechOutput = "To start a new game, say, start new game."
        + "To repeat the last move, say, repeat."
        + "Would you like to keep playing?",
        repromptText = "Good luck!";
    var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession, false));
}

function handleFinishSessionRequest(intent, session, callback) {
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Thanks for playing Twister with me!", "", true, false));
}

/**
 * Response Helper functions
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession, ssmlBool) {
    var outputS = {};
    if (ssmlBool) {
        outputS = {
            type: "SSML",
            ssml: output
        };
    } else {
        outputS = {
            type: "PlainText",
            text: output
        };
    }
    return {
        outputSpeech: outputS,
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}