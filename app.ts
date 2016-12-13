var canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;

class Objects {
    o;
    flat;

    constructor() {
        this.removeAll();
    }

    add(v) {
        var p = v.__proto__;
        while (p != null)
        {
            var k = p.constructor.name;
            if (k in this.o)
                this.o[k].push(v);
            else
                this.o[k] = [v];
            p = p.__proto__;
        }
    }

    get(k) {
        if (k in this.o)
            return this.o[k];
        return [];
    }

    remove(v) {
        var p = v.__proto__;
        while (p != null)
        {
            var k = p.constructor.name;
            var arr = this.o[k];
            arr.splice(arr.indexOf(v), 1);
            p = p.__proto__;
        }
    }

    removeAll() {
        this.flat = [];
        this.o = { "Object": this.flat };
    }
}

var objects = new Objects();
var selected = new Objects();

class Base {
    selected = false;
    dependsOn = [];

    render() { }

    distanceFrom(x, y) {
        return Number.MAX_VALUE;
    }
}

class PointBase extends Base {
    render() {
        ctx.fillStyle = this.selected ? 'red' : 'black';
        ctx.beginPath();
        ctx.arc(this.getX(), this.getY(), 7, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    }

    getX() {
        return NaN;
    }

    getY() {
        return NaN;
    }

    distanceFrom(x, y) {
        var d = Math.sqrt(Math.pow(x - this.getX(), 2) + Math.pow(y - this.getY(), 2));
        return Math.max(d - 15, 0);
    }

    getSlopeX(p2: PointBase) {
        return (this.getY() - p2.getY()) / (this.getX() - p2.getX());
    }

    getSlopeY(p2: PointBase) {
        return (this.getX() - p2.getX()) / (this.getY() - p2.getY());
    }
}

class Point extends PointBase {
    constructor(public x: number, public y: number, public name: string) {
        super();
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    render() {
        super.render();
        ctx.fillStyle = this.selected ? 'green' : 'black';
        ctx.font = 'Italic 30px Sans-Serif';
        ctx.fillText(this.name, this.x + 5, this.y - 5);
    }
}

class SegmentBase extends Base {
    getX1() {
        return NaN;
    }

    getY1() {
        return NaN;
    }

    getX2() {
        return NaN;
    }

    getY2() {
        return NaN;
    }

    getSlopeX() {
        return NaN;
    }

    getSlopeY() {
        return NaN;
    }

    vert() {
        return Math.abs(this.getSlopeX()) > 1;
    }

    render() {
        ctx.strokeStyle = this.selected ? 'blue' : 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.getX1(), this.getY1());
        ctx.lineTo(this.getX2(), this.getY2());
        ctx.stroke();
        ctx.closePath();
    }

    distanceFrom(x, y) {
        return distToSegment({ x: x, y: y }, { x: this.getX1(), y: this.getY1() }, { x: this.getX2(), y: this.getY2() });
    }
}

class Segment extends SegmentBase {
    constructor(public p1: PointBase, public p2: PointBase) {
        super();
        this.dependsOn.push(p1, p2);
    }

    getX1() {
        return this.p1.getX();
    }

    getY1() {
        return this.p1.getY();
    }

    getX2() {
        return this.p2.getX();
    }

    getY2() {
        return this.p2.getY();
    }

    getSlopeX() {
        return this.p1.getSlopeX(this.p2);
    }

    getSlopeY() {
        return this.p1.getSlopeY(this.p2);
    }
}

class LineBase extends SegmentBase {
    constructor(public p1: PointBase) {
        super();
        this.dependsOn.push(p1);
    }

    getX1() {
        return this.vert() ? this.p1.getX() + this.getSlopeY() * (0 - this.p1.getY()) : 0;
    }

    getY1() {
        return this.vert() ? 0 : this.p1.getY() + this.getSlopeX() * (0 - this.p1.getX());
    }

    getX2() {
        return this.vert() ? this.p1.getX() + this.getSlopeY() * (canvas.height - this.p1.getY()) : canvas.width;
    }

    getY2() {
        return this.vert() ? canvas.height : this.p1.getY() + this.getSlopeX() * (canvas.width - this.p1.getX());
    }
}

class Line extends LineBase {
    constructor(public p1: PointBase, public p2: PointBase) {
        super(p1);
        this.dependsOn.push(p2);
    }

    getSlopeX() {
        return this.p1.getSlopeX(this.p2);
    }

    getSlopeY() {
        return this.p1.getSlopeY(this.p2);
    }
}

class Perp extends LineBase {
    constructor(public p1: PointBase, public s1: SegmentBase) {
        super(p1);
        this.dependsOn.push(s1);
    }

    getSlopeX() {
        return -this.s1.getSlopeY();
    }

    getSlopeY() {
        return -this.s1.getSlopeX();
    }
}

class Midpoint extends PointBase {
    constructor(public p1: PointBase, public p2: PointBase) {
        super();
        this.dependsOn.push(p1, p2);
    }

    getX() {
        return (this.p1.getX() + this.p2.getX()) / 2;
    }

    getY() {
        return (this.p1.getY() + this.p2.getY()) / 2;
    }
}

class Button {
    el: HTMLElement;

    constructor(id: string, public valid: Function, public hotkey: Function, public action) {
        this.el = document.getElementById(id);
        this.el.onclick = action;
    }
}

function render() {
    localStorage.setItem("letter", letter.toString());

    localStorage.setItem("objects", JSON.stringify(objects.flat.map(function (o) {
        var no = {};
        for (var k in o)
            if (o.hasOwnProperty(k))
            {
                no[k] = index(o[k]);
            }
        return [o.__proto__.constructor.name, no];
    })));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var renderOrder = ["SegmentBase", "PointBase"];
    renderOrder.forEach(function (type) {
        objects.get(type).forEach((v: Base, i) => {
            v.render();
        });
    });

    buttons.forEach(function (o) {
        if (o.valid())
            o.el.style.display = "block";
        else
            o.el.style.display = "";
    });
}

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}

var buttons: Array<Button>;

function remove(os: Array<Base>) {
    if (os.length == 0)
        return;
    var toRemove = [];
    os.forEach(function (o) {
        objects.remove(o);
    });
    objects.flat.forEach(function (o: Base) {
        o.dependsOn.some(function (d) {
            if (os.indexOf(d) != -1) {
                toRemove.push(o);
                return true;
            }
            return false;
        });
    });
    remove(toRemove);
}

function depends2i(dependsOn) {
    return dependsOn.map(function (o) {
        return objects.flat.indexOf(o);
    }).sort();
}

function exists(name, dependsOn) {
    var v = depends2i(dependsOn);
    return objects.get(name).some(function (o) {
        return JSON.stringify(depends2i(o.dependsOn)) == JSON.stringify(v);
    });
}

var mx, my;
var letter = 65;

function index(v) {
    if (v instanceof Base)
        return { "index": objects.flat.indexOf(v) };
    else if (v instanceof Array)
        v = v.map(index);
    return v;
}

function unindex(v) {
    if (v instanceof Object && "index" in v)
        return objects.flat[v.index];
    else if (v instanceof Array)
        v = v.map(unindex);
    return v;
}

window.onload = function () {
    var sletter = localStorage.getItem("letter");
    if (sletter)
        letter = parseInt(sletter);

    var saved = localStorage.getItem("objects");
    if (saved) {
        JSON.parse(saved).forEach(function (o) {
            var n = Object.create(window[o[0]].prototype);
            for (var k in o[1]) {
                n[k] = unindex(o[1][k]);
            }
            objects.add(n);
            if (n.selected)
                selected.add(n);
        });
    }

    buttons = [
        new Button("renamepoint",
            function () {
                return selected.flat.length == 1 && selected.get("Point").length == 1;
            },
            function (e, k) {
                return k == "r";
            },
            function () {
                selected.flat[0].name = prompt("New name:", selected.flat[0].name);
                render();
            }
        ),
        new Button("deselect",
            function () {
                return selected.flat.length > 0;
            },
            function (e, k) {
                return k == "d" && e.ctrlKey;
            },
            function () {
                selected.flat.forEach(function (o: Base) {
                    o.selected = false;
                });
                selected.removeAll();
                render();
            }
        ),
        new Button("movepoint",
            function () {
                return selected.flat.length == 1 && selected.get("Point").length == 1;
            },
            function (e, k) {
                return k == "m";
            },
            function () {
                var p = selected.get("Point")[0];
                p.x = mx;
                p.y = my;
                render();
            }
        ),
        new Button("delete",
            function () {
                return selected.flat.length > 0;
            },
            function (e, k) {
                return k == "d";
            },
            function () {
                var toRemove = selected.flat;
                selected.removeAll();
                remove(toRemove);
                render();
            }
        ),
        new Button("segment",
            function () {
                if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                    return !exists("SegmentBase", selected.flat);
                return false;
            },
            function (e, k) {
                return k == "s";
            },
            function () {
                objects.add(new Segment(selected.flat[0], selected.flat[1]));
                render();
            }
        ),
        new Button("midpoint",
            function () {
                if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                    return !exists("Midpoint", selected.flat);
                return false;
            },
            function (e, k) {
                return k == "m" && e.ctrlKey;
            },
            function () {
                objects.add(new Midpoint(selected.flat[0], selected.flat[1]));
                render();
            }
        ),
        new Button("line",
            function () {
                if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                    return !exists("SegmentBase", selected.flat);
                return false;
            },
            function (e, k) {
                return k == "l";
            },
            function () {
                objects.add(new Line(selected.flat[0], selected.flat[1]));
                render();
            }
        ),
        new Button("perp",
            function () {
                if (selected.flat.length == 2 && selected.get("PointBase").length == 1 && selected.get("SegmentBase").length == 1)
                    return !exists("Perp", selected.flat);
                return false;
            },
            function (e, k) {
                return k == "p";
            },
            function () {
                objects.add(new Perp(selected.get("PointBase")[0], selected.get("SegmentBase")[0]));
                render();
            }
        )
    ]

    canvas = <HTMLCanvasElement> document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    resize();
    canvas.onclick = function(ev) {
        var dMin = Number.MAX_VALUE;
        var vMin;
        objects.flat.forEach((v: Base, i) => {
            var d = v.distanceFrom(ev.pageX, ev.pageY);
            if (d < dMin)
            {
                vMin = v;
                dMin = d;
            }
        });
        if (dMin < 25)
        {
            if (vMin.selected)
                selected.remove(vMin);
            else
                selected.add(vMin);
            vMin.selected = !vMin.selected;
        }
        else
        {
            objects.add(new Point(ev.pageX, ev.pageY, String.fromCharCode(letter)));
            letter = letter == 90 ? 65 : letter + 1;
        }
        render();
    }
    canvas.onmousemove = function (ev) {
        mx = ev.pageX;
        my = ev.pageY;
    };
};

document.addEventListener("keydown", function (e: KeyboardEvent) {
    var code = typeof e.which === "number" ? e.which : e.keyCode;
    var key = String.fromCharCode(code);
    key = key.toLowerCase();
    buttons.some(function (o) {
        if (o.valid() && o.hotkey(e, key))
        {
            o.action();
            e.preventDefault();
            return true;
        }
        return false;
    });
}, false);

window.onresize = resize;

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }