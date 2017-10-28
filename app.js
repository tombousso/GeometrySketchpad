var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var canvas, ctx;
var Objects = /** @class */ (function () {
    function Objects() {
        this.removeAll();
    }
    Objects.prototype.add = function (v) {
        var p = v.__proto__;
        while (p != null) {
            var k = p.constructor.name;
            if (k in this.o)
                this.o[k].push(v);
            else
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
}());
var objects = new Objects();
var selected = new Objects();
var Base = /** @class */ (function () {
    function Base() {
        this.selected = false;
        this.dependsOn = [];
    }
    Base.prototype.distanceFrom = function (x, y) {
        return Number.MAX_VALUE;
    };
    return Base;
}());
var PointBase = /** @class */ (function (_super) {
    __extends(PointBase, _super);
    function PointBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PointBase.prototype.render = function () {
        ctx.fillStyle = this.selected ? 'red' : 'black';
        ctx.beginPath();
        ctx.arc(this.getX(), this.getY(), 7, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    };
    PointBase.prototype.distanceFrom = function (x, y) {
        var d = Math.sqrt(Math.pow(x - this.getX(), 2) + Math.pow(y - this.getY(), 2));
        return Math.max(d - 15, 0);
    };
    PointBase.prototype.getSlopeX = function (p2) {
        return (this.getY() - p2.getY()) / (this.getX() - p2.getX());
    };
    PointBase.prototype.getSlopeY = function (p2) {
        return (this.getX() - p2.getX()) / (this.getY() - p2.getY());
    };
    return PointBase;
}(Base));
var Point = /** @class */ (function (_super) {
    __extends(Point, _super);
    function Point(x, y, name) {
        var _this = _super.call(this) || this;
        _this.x = x;
        _this.y = y;
        _this.name = name;
        return _this;
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
}(PointBase));
var SegmentBase = /** @class */ (function (_super) {
    __extends(SegmentBase, _super);
    function SegmentBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SegmentBase.prototype.vert = function () {
        return Math.abs(this.getSlopeX()) > 1;
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
}(Base));
var Segment = /** @class */ (function (_super) {
    __extends(Segment, _super);
    function Segment(p1, p2) {
        var _this = _super.call(this) || this;
        _this.p1 = p1;
        _this.p2 = p2;
        _this.dependsOn.push(p1, p2);
        return _this;
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
    Segment.prototype.getSlopeX = function () {
        return this.p1.getSlopeX(this.p2);
    };
    Segment.prototype.getSlopeY = function () {
        return this.p1.getSlopeY(this.p2);
    };
    return Segment;
}(SegmentBase));
var LineBase = /** @class */ (function (_super) {
    __extends(LineBase, _super);
    function LineBase(p1) {
        var _this = _super.call(this) || this;
        _this.p1 = p1;
        _this.dependsOn.push(p1);
        return _this;
    }
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
}(SegmentBase));
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    function Line(p1, p2) {
        var _this = _super.call(this, p1) || this;
        _this.p1 = p1;
        _this.p2 = p2;
        _this.dependsOn.push(p2);
        return _this;
    }
    Line.prototype.getSlopeX = function () {
        return this.p1.getSlopeX(this.p2);
    };
    Line.prototype.getSlopeY = function () {
        return this.p1.getSlopeY(this.p2);
    };
    return Line;
}(LineBase));
var Perp = /** @class */ (function (_super) {
    __extends(Perp, _super);
    function Perp(p1, s1) {
        var _this = _super.call(this, p1) || this;
        _this.p1 = p1;
        _this.s1 = s1;
        _this.dependsOn.push(s1);
        return _this;
    }
    Perp.prototype.getSlopeX = function () {
        return -this.s1.getSlopeY();
    };
    Perp.prototype.getSlopeY = function () {
        return -this.s1.getSlopeX();
    };
    return Perp;
}(LineBase));
var Midpoint = /** @class */ (function (_super) {
    __extends(Midpoint, _super);
    function Midpoint(points) {
        var _this = _super.call(this) || this;
        _this.points = points;
        _this.dependsOn = _this.points;
        return _this;
    }
    Midpoint.prototype.getX = function () {
        var sumX = 0;
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var point = _a[_i];
            sumX += point.getX();
        }
        return sumX / this.points.length;
    };
    Midpoint.prototype.getY = function () {
        var sumY = 0;
        for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
            var point = _a[_i];
            sumY += point.getY();
        }
        return sumY / this.points.length;
    };
    return Midpoint;
}(PointBase));
var Button = /** @class */ (function () {
    function Button(id, valid, hotkey, action) {
        this.valid = valid;
        this.hotkey = hotkey;
        this.action = action;
        this.el = document.getElementById(id);
        this.el.onclick = action;
    }
    return Button;
}());
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
var buttons;
function remove(os) {
    if (os.length == 0)
        return;
    var toRemove = [];
    os.forEach(function (o) {
        objects.remove(o);
    });
    objects.flat.forEach(function (o) {
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
        new Button("renamepoint", function () {
            return selected.flat.length == 1 && selected.get("Point").length == 1;
        }, function (e, k) {
            return k == "r" && !e.ctrlKey;
        }, function () {
            var newName = prompt("New name:", selected.flat[0].name);
            if (newName)
                selected.flat[0].name = newName;
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
            if (selected.flat.length >= 2 && selected.flat.length == selected.get("PointBase").length)
                return !exists("Midpoint", selected.flat);
            return false;
        }, function (e, k) {
            return k == "m" && e.ctrlKey;
        }, function () {
            objects.add(new Midpoint(selected.flat.slice()));
            render();
        }),
        new Button("parents", function () {
            return selected.flat.length === 1 && selected.flat[0].dependsOn.length > 0;
        }, function (e, k) {
            return k == "p";
        }, function () {
            for (var _i = 0, _a = selected.flat[0].dependsOn; _i < _a.length; _i++) {
                var base = _a[_i];
                selected.add(base);
            }
            selected.flat.forEach(function (o) {
                o.selected = true;
            });
            selected.flat[0].selected = false;
            selected.remove(selected.flat[0]);
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
            if (selected.flat.length == 2 && selected.get("PointBase").length == 1 && selected.get("SegmentBase").length == 1)
                return !exists("Perp", selected.flat);
            return false;
        }, function (e, k) {
            return k == "p";
        }, function () {
            objects.add(new Perp(selected.get("PointBase")[0], selected.get("SegmentBase")[0]));
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
                selected.remove(vMin);
            else
                selected.add(vMin);
            vMin.selected = !vMin.selected;
        }
        else {
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
    buttons.some(function (o) {
        if (o.valid() && o.hotkey(e, key)) {
            o.action();
            e.preventDefault();
            return true;
        }
        return false;
    });
}, false);
window.onresize = resize;
function sqr(x) { return x * x; }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
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
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
