var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var canvas, ctx;

var Objects = (function () {
    function Objects() {
        this.removeAll();
    }
    Objects.prototype.add = function (v) {
        var p = v.__proto__;
        while (p != null) {
            var k = p.constructor.name;
            if (k in this.o)
                this.o[k].push(v); else
                this.o[k] = [v];
            p = p.__proto__;
        }
    };

    Objects.prototype.get = function (k) {
        if (k in this.o)
            return this.o[k];
        return [];
    };

    Objects.prototype.remove = function (v) {
        var p = v.__proto__;
        while (p != null) {
            var k = p.constructor.name;
            var arr = this.o[k];
            arr.splice(arr.indexOf(v), 1);
            p = p.__proto__;
        }
    };

    Objects.prototype.removeAll = function () {
        this.flat = [];
        this.o = { "Object": this.flat };
    };
    return Objects;
})();

var objects = new Objects();
var selected = new Objects();

var Base = (function () {
    function Base() {
        this.selected = false;
        this.dependsOn = [];
    }
    Base.prototype.render = function () {
    };

    Base.prototype.distanceFrom = function (x, y) {
        return Number.MAX_VALUE;
    };
    return Base;
})();

var PointBase = (function (_super) {
    __extends(PointBase, _super);
    function PointBase() {
        _super.apply(this, arguments);
    }
    PointBase.prototype.render = function () {
        ctx.fillStyle = this.selected ? 'red' : 'black';
        ctx.beginPath();
        ctx.arc(this.getX(), this.getY(), 7, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    };

    PointBase.prototype.getX = function () {
        return NaN;
    };

    PointBase.prototype.getY = function () {
        return NaN;
    };

    PointBase.prototype.distanceFrom = function (x, y) {
        var d = Math.sqrt(Math.pow(x - this.getX(), 2) + Math.pow(y - this.getY(), 2));
        return Math.max(d - 15, 0);
    };
    return PointBase;
})(Base);

var Point = (function (_super) {
    __extends(Point, _super);
    function Point(x, y, name) {
        _super.call(this);
        this.x = x;
        this.y = y;
        this.name = name;
    }
    Point.prototype.getX = function () {
        return this.x;
    };

    Point.prototype.getY = function () {
        return this.y;
    };

    Point.prototype.render = function () {
        _super.prototype.render.call(this);
        ctx.fillStyle = this.selected ? 'green' : 'black';
        ctx.font = 'Italic 30px Sans-Serif';
        ctx.fillText(this.name, this.x + 5, this.y - 5);
    };
    return Point;
})(PointBase);

var SegmentBase = (function (_super) {
    __extends(SegmentBase, _super);
    function SegmentBase() {
        _super.apply(this, arguments);
    }
    SegmentBase.prototype.getX1 = function () {
        return NaN;
    };

    SegmentBase.prototype.getY1 = function () {
        return NaN;
    };

    SegmentBase.prototype.getX2 = function () {
        return NaN;
    };

    SegmentBase.prototype.getY2 = function () {
        return NaN;
    };

    SegmentBase.prototype.render = function () {
        ctx.strokeStyle = this.selected ? 'blue' : 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.getX1(), this.getY1());
        ctx.lineTo(this.getX2(), this.getY2());
        ctx.stroke();
        ctx.closePath();
    };

    SegmentBase.prototype.distanceFrom = function (x, y) {
        return distToSegment({ x: x, y: y }, { x: this.getX1(), y: this.getY1() }, { x: this.getX2(), y: this.getY2() });
    };
    return SegmentBase;
})(Base);

var Segment = (function (_super) {
    __extends(Segment, _super);
    function Segment(p1, p2) {
        _super.call(this);
        this.p1 = p1;
        this.p2 = p2;
        this.dependsOn.push(p1, p2);
    }
    Segment.prototype.getX1 = function () {
        return this.p1.getX();
    };

    Segment.prototype.getY1 = function () {
        return this.p1.getY();
    };

    Segment.prototype.getX2 = function () {
        return this.p2.getX();
    };

    Segment.prototype.getY2 = function () {
        return this.p2.getY();
    };
    return Segment;
})(SegmentBase);

var LineBase = (function (_super) {
    __extends(LineBase, _super);
    function LineBase(p1) {
        _super.call(this);
        this.p1 = p1;
        this.dependsOn.push(p1);
    }
    LineBase.prototype.getSlopeX = function () {
        return NaN;
    };

    LineBase.prototype.getSlopeY = function () {
        return NaN;
    };

    LineBase.prototype.vert = function () {
        return Math.abs(this.getSlopeX()) > 1;
    };

    LineBase.prototype.getX1 = function () {
        return this.vert() ? this.p1.getX() + this.getSlopeY() * (0 - this.p1.getY()) : 0;
    };

    LineBase.prototype.getY1 = function () {
        return this.vert() ? 0 : this.p1.getY() + this.getSlopeX() * (0 - this.p1.getX());
    };

    LineBase.prototype.getX2 = function () {
        return this.vert() ? this.p1.getX() + this.getSlopeY() * (canvas.height - this.p1.getY()) : canvas.width;
    };

    LineBase.prototype.getY2 = function () {
        return this.vert() ? canvas.height : this.p1.getY() + this.getSlopeX() * (canvas.width - this.p1.getX());
    };
    return LineBase;
})(SegmentBase);

var Line = (function (_super) {
    __extends(Line, _super);
    function Line(p1, p2) {
        _super.call(this, p1);
        this.p1 = p1;
        this.p2 = p2;
        this.dependsOn.push(p2);
    }
    Line.prototype.getSlopeX = function () {
        return (this.p1.getY() - this.p2.getY()) / (this.p1.getX() - this.p2.getX());
    };

    Line.prototype.getSlopeY = function () {
        return (this.p1.getX() - this.p2.getX()) / (this.p1.getY() - this.p2.getY());
    };
    return Line;
})(LineBase);

var Perp = (function (_super) {
    __extends(Perp, _super);
    function Perp(p1, l1) {
        _super.call(this, p1);
        this.p1 = p1;
        this.l1 = l1;
        this.dependsOn.push(l1);
    }
    Perp.prototype.getSlopeX = function () {
        return -this.l1.getSlopeY();
    };

    Perp.prototype.getSlopeY = function () {
        return -this.l1.getSlopeX();
    };
    return Perp;
})(LineBase);

var Midpoint = (function (_super) {
    __extends(Midpoint, _super);
    function Midpoint(p1, p2) {
        _super.call(this);
        this.p1 = p1;
        this.p2 = p2;
        this.dependsOn.push(p1, p2);
    }
    Midpoint.prototype.getX = function () {
        return (this.p1.getX() + this.p2.getX()) / 2;
    };

    Midpoint.prototype.getY = function () {
        return (this.p1.getY() + this.p2.getY()) / 2;
    };
    return Midpoint;
})(PointBase);

var Button = (function () {
    function Button(id, valid, hotkey, action) {
        this.valid = valid;
        this.hotkey = hotkey;
        this.action = action;
        this.el = document.getElementById(id);
        this.el.onclick = action;
    }
    return Button;
})();

function render() {
    localStorage.setItem("letter", letter.toString());

    localStorage.setItem("objects", JSON.stringify(objects.flat.map(function (o) {
        var no = {};
        for (var k in o)
            if (o.hasOwnProperty(k)) {
                no[k] = index(o[k]);
            }
        return [o.__proto__.constructor.name, no];
    })));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var renderOrder = ["SegmentBase", "PointBase"];
    renderOrder.forEach(function (type) {
        objects.get(type).forEach(function (v, i) {
            v.render();
        });
    });

    buttons.forEach(function (o) {
        if (o.valid())
            o.el.style.display = "block"; else
            o.el.style.display = "";
    });
}

function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}

var buttons;

function remove(os) {
    if (os.length == 0)
        return;
    var toRemove = [];
    os.forEach(function (o) {
        objects.remove(o);
    });
    objects.flat.forEach(function (o) {
        o.dependsOn.forEach(function (d) {
            if (os.indexOf(d) != -1)
                toRemove.push(o);
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
    return objects.flat.some(function (o) {
        return JSON.stringify(depends2i(o.dependsOn)) == JSON.stringify(v);
    });
}

var mx, my;
var letter = 65;

function index(v) {
    if (v instanceof Base)
        return { "index": objects.flat.indexOf(v) }; else if (v instanceof Array)
        v = v.map(index);
    return v;
}

function unindex(v) {
    if (v instanceof Object && "index" in v)
        return objects.flat[v.index]; else if (v instanceof Array)
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
        new Button("renamepoint", function () {
            return selected.flat.length == 1 && selected.get("Point").length == 1;
        }, function (e, k) {
            return k == "r";
        }, function () {
            selected.flat[0].name = prompt("New name:", selected.flat[0].name);
            render();
        }),
        new Button("deselect", function () {
            return selected.flat.length > 0;
        }, function (e, k) {
            return k == "d" && e.ctrlKey;
        }, function () {
            selected.flat.forEach(function (o) {
                o.selected = false;
            });
            selected.removeAll();
            render();
        }),
        new Button("movepoint", function () {
            return selected.flat.length == 1 && selected.get("Point").length == 1;
        }, function (e, k) {
            return k == "m";
        }, function () {
            var p = selected.get("Point")[0];
            p.x = mx;
            p.y = my;
            render();
        }),
        new Button("delete", function () {
            return selected.flat.length > 0;
        }, function (e, k) {
            return k == "d";
        }, function () {
            var toRemove = selected.flat;
            selected.removeAll();
            remove(toRemove);
            render();
        }),
        new Button("segment", function () {
            if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                return !exists("SegmentBase", selected.flat);
            return false;
        }, function (e, k) {
            return k == "s";
        }, function () {
            objects.add(new Segment(selected.flat[0], selected.flat[1]));
            render();
        }),
        new Button("midpoint", function () {
            if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                return !exists("Midpoint", selected.flat);
            return false;
        }, function (e, k) {
            return k == "m" && e.ctrlKey;
        }, function () {
            objects.add(new Midpoint(selected.flat[0], selected.flat[1]));
            render();
        }),
        new Button("line", function () {
            if (selected.flat.length == 2 && selected.get("PointBase").length == 2)
                return !exists("SegmentBase", selected.flat);
            return false;
        }, function (e, k) {
            return k == "l";
        }, function () {
            objects.add(new Line(selected.flat[0], selected.flat[1]));
            render();
        }),
        new Button("perp", function () {
            if (selected.flat.length == 2 && selected.get("PointBase").length == 1 && selected.get("Line").length == 1) {
                return !exists("Perp", selected.flat);
            }
            return false;
        }, function (e, k) {
            return k == "p";
        }, function () {
            objects.add(new Perp(selected.get("PointBase")[0], selected.get("Line")[0]));
            render();
        })
    ];

    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    resize();
    canvas.onclick = function (ev) {
        var dMin = Number.MAX_VALUE;
        var vMin;
        objects.flat.forEach(function (v, i) {
            var d = v.distanceFrom(ev.pageX, ev.pageY);
            if (d < dMin) {
                vMin = v;
                dMin = d;
            }
        });
        if (dMin < 25) {
            if (vMin.selected)
                selected.remove(vMin); else
                selected.add(vMin);
            vMin.selected = !vMin.selected;
        } else {
            objects.add(new Point(ev.pageX, ev.pageY, String.fromCharCode(letter)));
            letter = letter == 90 ? 65 : letter + 1;
        }
        render();
    };
    canvas.onmousemove = function (ev) {
        mx = ev.pageX;
        my = ev.pageY;
    };
};

document.addEventListener("keydown", function (e) {
    var code = typeof e.which === "number" ? e.which : e.keyCode;
    var key = String.fromCharCode(code);
    key = key.toLowerCase();
    var act = false;
    buttons.forEach(function (o) {
        if (!act && o.valid() && o.hotkey(e, key)) {
            o.action();
            e.preventDefault();
            act = true;
        }
    });
}, false);

window.onresize = resize;

function sqr(x) {
    return x * x;
}
function dist2(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0)
        return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}
function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}
