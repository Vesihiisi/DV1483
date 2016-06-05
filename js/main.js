$(document).ready(function() {
    'use strict';
    var url = "ws://108.61.197.77:4321";
    var websocket;
    var main = $("#echo");
    var inputName = $("#input-name");
    var inputEmail = $("#input-email");
    var inputNameButton = $("#input-name-button");
    var log;
    var send;
    var message;
    var windowActive;
    var namesArray = [];
    var imgsArray = [];
    var myName;
    var unreadMessages = 0;
    var documentTitle = "Chat";





    window.onfocus = function() {
        windowActive = true;
        unreadMessages = 0;
        document.title = documentTitle;
    };

    window.onblur = function() {
        windowActive = false;
    };

    // http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
    function replaceURLWithHTMLLinks(textWithUrl) {
        var regex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return textWithUrl.replace(regex, "<a href='$1' target='_blank'>$1</a>");
    }


    function Message(jsonstring) {
        var object = JSON.parse(jsonstring);
        this.author = object.author;
        this.type = object.type;
        if (this.type === "default") {

            this.content = replaceURLWithHTMLLinks(object.content);
        } else {
            this.content = object.content; // avoid mangling data from server
        }

        this.timestamp = object.timestamp;

    }

    function clearAndFocus(inputField) {
        inputField.val("");
        inputField.focus();
    }



    function createInterface() {
        function toggleParticipantsList() {
            $("#participants").animate({
                width: 'toggle'
            }, "fast");
        }

        inputName.remove();
        inputNameButton.remove();
        $("h3").remove();
        // this is horrible but it works
        main.append('<div id="chat-header" class="chat-header"><p>Chatroom [<span class="header-name" id="header-name"></span>]<i id="show-userlist" class="icon ion-person-stalker"></i></p></div>');
        main.append('<div id="participants" class="participants"><h4><i id="close-participants-list" class="icon ion-arrow-return-left"></i><span id="online-number"></span> online</h4><div id="list"></div></div>');
        main.append('<div id="chat-window" class="chat-window"></div>');
        main.append('<div class="input-row"><input type="text" id="message" class="message" value=""><button id="send-button" class="send-button"><i class="icon ion-paper-airplane"></i></button></div>');
        send = $('#send-button');
        log = $('#chat-window');
        message = $('#message');
        log.val(""); // prevent browser from autosaving
        clearAndFocus(message);
        send.on("click", function(event) {
            var messageText = message.val();
            if (messageText.length === 0) { // don't send empty msg
                return;
            }
            if (!websocket || websocket.readyState === 3) {
            } else {
                websocket.send(messageText);
                clearAndFocus(message);
            }
        });

        $("#show-userlist").on("click", function() {
            toggleParticipantsList();
        });

        $("#close-participants-list").on("click", function() {
            toggleParticipantsList();
        });

        $(document).keypress(function(e) {
            if (e.which === 13) {
                send.click();
            }
        });
        $(window).trigger('resize'); // if we start off in desktop mode, make sure to remove unncecessary buttons
    }

    function addToLog(where, message) {
        /**
         * Surround string with <p> tags with certain class.
         */
        function para(pclass, string) {
            return "<p class='" + pclass + "'>" + string + "</p>";
        }
        /**
         * Unix time to human readable
         */
        function prettyTimestamp(unixTime) {
            var momentObject = moment.unix(unixTime);
            return momentObject.format("HH:mm:ss");
        }

        function mentionsMe(text) {
            if (text.toLowerCase().indexOf("@" + myName) >= 0) {
                return true;
            } else {
                return false;
            }
        }

        function markMention(jqueryElement) {
            jqueryElement.addClass("mention");
        }

        function notify(message) {
            Push.create(prettyTimestamp(message.timestamp) + " | " + message.author, {
                body: message.content,
                icon: imgsArray[namesArray.indexOf(message.author)]
            });
        }

        if (message.type === "default") { // if message comes from normal user, display user img
            var img = imgsArray[namesArray.indexOf(message.author)];
            $(where).append("<img src=" + img + " class='gravatar'>");
        }
        $(where).append(para("message-header", "<span class='author'>" + message.author + "</span>" + "<span class='timestamp'>" + prettyTimestamp(message.timestamp) + "</span>"));
        var bread = $(para("message-content", "<span class='content " + message.type + "'>" + message.content + "</span>"));
        $(where).append(bread);
        if (mentionsMe(message.content)) {
            markMention(bread);
            notify(message);
        }

        where.animate({ scrollTop: where[0].scrollHeight }, 500); // Scroll to the bottom!
    }

    function updateListOfParticipants(list) {
        function addLine(img, username) {
            return "<p><img src='" + img + "'>" + username + "</p>";
        }
        var listArray = list.split(",");
        namesArray = [];
        imgsArray = [];


        $.each(listArray, function(index, value) {
            if (index % 2 === 0) {
                namesArray.push(value);
            } else {
                var decoded = value.replace(/&amp;/g, '&'); // workaround for &amp in img url
                imgsArray.push(decoded); // without it, img doesn't show correctly in desktop notifications
            }
        });
        $("#online-number").text(namesArray.length);
        $("#show-userlist").html("<span class='number-indicator'>" + namesArray.length + "</span>");
        $("#participants").children("#list").empty();
        $.each(namesArray, function(index, value) {
            $("#participants").children("#list").append(addLine(imgsArray[index], value));
        });
    }

    function updateMyName(name) {
        myName = name;
        $("#header-name").text(myName);
    }


    function connectToServer(name, email) {
        websocket = new WebSocket(url, 'broadcast-protocol');
        websocket.onopen = function() {
            websocket.send("/me_first " + name);
            websocket.send("/get_img " + email);
        };

        websocket.onmessage = function(event) {
            var message = new Message(event.data);
            if (message.type === "user-list") {
                updateListOfParticipants(message.content);
            } else if (message.type === "user-name") {
                updateMyName(message.content);
            } else {
                addToLog(log, message);
            }

            if (message.type === "default" && windowActive === false) {
                unreadMessages = unreadMessages + 1;
                document.title = "[" + unreadMessages.toString() + "] " + documentTitle;
            }
        };

        // Eventhandler when the websocket is closed.
        websocket.onclose = function() {
        };
    }

    $(document).keypress(function(e) {
        if (e.which === 13) {
            inputNameButton.click();
        }
    });

    clearAndFocus(inputName);

    inputNameButton.on("click", function() {
        var name = inputName.val();
        var email = inputEmail.val();
        if (name.length > 0 && email.length > 0) {
            createInterface();
            connectToServer(name, email);
        }
    });




    $(window).resize(checkSize);


    function checkSize() {
        if ($(window).width() > 800) { // desktop layout
            $("#show-userlist").hide();
            $("#close-participants-list").hide();
            $("#participants").show();
        } else {
            $("#show-userlist").show();
            $("#close-participants-list").show();
            $("#participants").hide();
        }
    }


});
