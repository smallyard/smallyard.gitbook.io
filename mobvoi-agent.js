/*
 * 不支持IE8以及以下版本
 */
(function() {
    try {
        var zipkinUrl = "http://localhost:9411/api/v2/spans";
        var projectName = "ticbuy";

        // js error
        window.addEventListener("error",
        function(event) {
            var tags = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                href: window.location.href,
                userAgent: window.navigator.userAgent
            }
            sendToZipkin(projectName + "_jsError", event.filename, tags);
        });

        // ajax error
        var wrapSend = function(originSend) {
            return function() {
                var parm = arguments[0] || "";
                this.addEventListener("readystatechange",
                function() {
                    debugger;
                    var url = this._runtime.url.toString();
                    if (url.startsWith(zipkinUrl)) {
                        return;
                    }
                    if (this.readyState == 4 && this.status >= 400) {
                        try {
                            var tags = {
                                url: url,
                                status: this.status,
                                responseText: this.responseText,
                                statusText: this.statusText,
                                href: window.location.href,
                                userAgent: window.navigator.userAgent
                            }
                            sendToZipkin(projectName + "_ajaxError", this.responseURL, tags);
                        } catch(e) {}
                    }
                });
                try {
                    return originSend.apply(this, arguments)
                } catch(p) {
                    return Function.prototype.apply.call(originSend, this, arguments)
                }
            };
        };
        var originSend = window.XMLHttpRequest.prototype.send;
        window.XMLHttpRequest.prototype.send = wrapSend(originSend);

        // send to zipkin
        window.sendToZipkin = function(serviceName, name, tags) {
            var data = [{
                "traceId": new Date().getTime().toString() + Math.floor(Math.random() * 1000),
                "id": new Date().getTime().toString() + Math.floor(Math.random() * 1000),
                "name": name,
                "duration": 1,
                "kind": "PRODUCER",
                "timestamp": new Date().getTime() * 1000,
                "localEndpoint": {
                    "serviceName": serviceName
                },
                "tags": tags
            }]
            var xhr = new XMLHttpRequest();
            xhr.open("post", zipkinUrl);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(data));
        }
    } catch(e) {}

})();
