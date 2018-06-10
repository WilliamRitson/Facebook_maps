export class Tooltip {
    constructor(contentTransform) {
        this.contentTransform = contentTransform;
        this.element = document.createElement("div");
        this.element.classList = ["tooltip"];
        document.getElementsByTagName("body")[0].appendChild(this.element);

        document.onmousemove = this.handleMouseMove.bind(this);

        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.hide();
    }

    show(data) {
        this.element.innerHTML = this.contentTransform(data);
        this.element.style.opacity = "1";
    }

    hide() {
        this.element.style.opacity = "0";
    }

    // Adapted from https://stackoverflow.com/a/7790764/1078437
    handleMouseMove(event) {
        let eventDoc, doc, body;

        event = event || window.event; // IE-ism

        // If pageX/Y aren't available and clientX/Y are,
        // calculate pageX/Y - logic taken from jQuery.
        // (This is to support old IE)
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX =
                event.clientX +
                ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
                ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
            event.pageY =
                event.clientY +
                ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
                ((doc && doc.clientTop) || (body && body.clientTop) || 0);
        }

        this.element.style.left = event.pageX + 30 + "px";
        this.element.style.top = event.pageY - this.element.offsetHeight / 2 + "px";
    }
}
