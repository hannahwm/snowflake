/*! project-name v0.0.1 | (c) 2020 YOUR NAME | MIT License | http://link-to-your-git-repo.com */
var $ = jQuery;

( (function( $ ) {
  var Neu = Neu || {};

  $.fn.canvasTest = function(options) {
      return this.each((function() {
          const canvasTest = Object.create(Neu.canvasTest);
          canvasTest.init(this, options);
      }));
  };

  $.fn.canvasTest.options = {
      canvasId: "canvas",
      saveBtn: "#save",
      clearBtn: "#clear",
      undoBtn: "#undo"
  };

  Neu.canvasTest = {
    init: function(elem, options) {
        const self = this;
        self.$container = $(elem);
        self.options = $.extend({}, $.fn.canvasTest.options, options);

        self.bindElements();
        self.bindEvents();
    },
    bindElements: function() {
      const self = this;

      drawing = false;
      startX = 0;
      startY = 0;
      endX = 0;
      endY = 0;
      imageData = null;
      moves = [];
      isTouch = false;
      mousePos = {x:0,y:0};
      tinyDevice =  false;
      smallDevice = false;

      if ($(window).width() < 440) {
        const oldCanvas = document.getElementById(self.options.canvasId);
        oldCanvas.remove();

        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width  = 300;
        canvas.height = 300;
        $(".canvas-wrapper").append(canvas);

        tinyDevice = true;
      } else if ($(window).width() < 640) {
        const oldCanvas = document.getElementById(self.options.canvasId);
        oldCanvas.remove();

        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.width  = 400;
        canvas.height = 400;
        $(".canvas-wrapper").append(canvas);

        smallDevice = true;
      }
    },
    bindEvents: function() {
      const self = this;
      const canvas = document.getElementById(self.options.canvasId);
      const ctx = canvas.getContext("2d");

      //eventListeners
      canvas.addEventListener("mousedown", self.startPosition);
      canvas.addEventListener("mouseup", self.endPosition);
      canvas.addEventListener("mousemove", self.draw);

      // Set up touch events for mobile, etc
      canvas.addEventListener("touchstart", (function (e) {
        isTouch = true;
        mousePos = getTouchPos(canvas, e);
        const mouseEvent = new MouseEvent("mousedown", {});
        canvas.dispatchEvent(mouseEvent);
      }), false);
      canvas.addEventListener("touchend", (function (e) {
        isTouch = true;
        const mouseEvent = new MouseEvent("mouseup", {});
        canvas.dispatchEvent(mouseEvent);
      }), false);
      canvas.addEventListener("touchmove", (function (e) {
        isTouch = true;
        mousePos = getTouchPos(canvas, e);
        const mouseEvent = new MouseEvent("mousemove", {});
        canvas.dispatchEvent(mouseEvent);
      }), false);

      // Get the position of a touch relative to the canvas
      function getTouchPos(canvasDom, touchEvent) {
        var rect = canvasDom.getBoundingClientRect();
        return {
          x: touchEvent.touches[0].clientX - rect.left,
          y: touchEvent.touches[0].clientY - rect.top
        };
      }

      //prevent scrolling on touch dragging
      document.body.addEventListener("touchmove", (function (e) {
        if (e.target == canvas) {
          e.preventDefault();
        }
      }), {passive: false});

    	$(self.options.saveBtn).on("click", (function(e) {
    			Canvas2Image.saveAsJPEG(canvas, 600, 600);
    	}));

      $(self.options.clearBtn).on("click", (function(e) {
    			ctx.clearRect(0,0,canvas.width,canvas.height);
          moves = [];
    	}));

      $(self.options.undoBtn).on("click", self.undoLast);

    },
    startPosition: function(e) {
      const self = this;
      const canvas = this;
      const ctx = canvas.getContext("2d");

      if (isTouch === true) {
        startX = mousePos.x;
        startY = mousePos.y;
      } else {
        startX = e.offsetX;
        startY = e.offsetY;
      }
      imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      drawing = true;
    },
    endPosition: function(e) {
      const self = this;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      if (tinyDevice) {
        ctx.lineWidth = 2;
      } else if (smallDevice) {
        ctx.lineWidth = 3;
      } else {
        ctx.lineWidth = 4;
      }
      ctx.lineCap = "round";
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.beginPath();

      drawing = false;

      //find all rotated/mirrored points in order to push them to an array that can be used to redraw everything when the user clicks undo
      let center = {x: 0, y: 0};

      if (tinyDevice) {
        center = {x: 150, y: 150};
      } else if (smallDevice) {
        center = {x: 200, y: 200};
      } else {
        center = {x: 300, y: 300};
      }

      const slices = 6;
      const point = {x: startX, y: startY};
      const rotate = (Math.PI * 2) / 5;

      function rotateOne(point, center, rotate, result = {}) {
          const vx = point.x - center.x;
          const vy = point.y - center.y;
          const xAx = Math.cos(rotate);
          const xAy = Math.sin(rotate);
          result.x = vx * xAx - vy * xAy + center.x;
          result.y = vx * xAy + vy * xAx + center.y;
          return result;
      }

      function rotateAll(point, steps, result = []) {
          const ang = Math.PI * 2 / steps;
          result.push(point);                      // Add first point
          for (let rot = 1; rot < steps; rot++) {  // Add remaining points
              result.push(rotateOne(point, center, rot * ang));
          }
          return result;
      }

      function mirrorPoint(point, mirrorX, mirrorY, center, result = {}) {
        result.x = (point.x - center.x) * (mirrorX ? -1 : 1) + center.x;
        result.y = (point.y - center.y) * (mirrorY ? -1 : 1) + center.y;
        return result;
      }

      function mirrorAll(array, steps, result = []) {
        for (let i = 0; i < slices; i++) {
          result.push(mirrorPoint({x: array[i].x, y:  array[i].y}, true, false, center))
        }
        return result;
      }

      const startPoints = rotateAll({x: startX, y: startY}, slices);
      const endPoints = rotateAll({x: endX, y: endY}, slices);

      const mirrorStartPoints = mirrorAll(startPoints, slices);
      const mirrorEndPoints = mirrorAll(endPoints, slices);

      //push all points to an array (in the correct order aka startpoint --> endpoint, repeat)
      for (let o = 0; o < startPoints.length; o++) {
        moves.push(
          { move: {
            start: {
              x: startPoints[o].x,
              y: startPoints[o].y
            },
            end: {
              x: endPoints[o].x,
              y: endPoints[o].y
            }
          } }
        )
      }

      for (let o = 0; o < mirrorStartPoints.length; o++) {
        moves.push(
          { move: {
            start: {
              x: mirrorStartPoints[o].x,
              y: mirrorStartPoints[o].y
            },
            end: {
              x: mirrorEndPoints[o].x,
              y: mirrorEndPoints[o].y
            }
          } }
        )
      }
    },
    undoLast: function() {
      const self = this;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      for (let o = 0; o < 12; o++) {
        moves.pop();
      }

      if(moves.length<0){return;}

      ctx.clearRect(0,0,canvas.width,canvas.height);

      for(var i=0;i<moves.length;i++){

        var pt=moves[i];

        if (tinyDevice) {
          ctx.lineWidth = 2;
        } else if (smallDevice) {
          ctx.lineWidth = 3;
        } else {
          ctx.lineWidth = 4;
        }

        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(pt.move.start.x,pt.move.start.y);

        ctx.lineTo(pt.move.end.x,pt.move.end.y);
        ctx.strokeStyle = '#ffffff';

        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pt.move.end.x,pt.move.end.y);
      }
    },
    draw: function(e) {
      const self = this;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      if(!drawing) {
        return;
      }

      if (isTouch === true) {
        endX = mousePos.x;
        endY = mousePos.y;
      } else {
        endX = e.offsetX;
        endY = e.offsetY;
      }

      let center = {x: 0, y: 0};

      if (tinyDevice) {
        center = {x: 150, y: 150};
      } else if (smallDevice) {
        center = {x: 200, y: 200};
      } else {
        center = {x: 300, y: 300};
      }

      const slices = 6;
      const point = {x: startX, y: startY};
      const rotate = (Math.PI * 2) / 5;

      function rotateOne(point, center, rotate, result = {}) {
          const vx = point.x - center.x;
          const vy = point.y - center.y;
          const xAx = Math.cos(rotate);
          const xAy = Math.sin(rotate);
          result.x = vx * xAx - vy * xAy + center.x;
          result.y = vx * xAy + vy * xAx + center.y;
          return result;
      }

      function rotateAll(point, steps, result = []) {
          const ang = Math.PI * 2 / steps;
          result.push(point);                      // Add first point
          for (let rot = 1; rot < steps; rot++) {  // Add remaining points
              result.push(rotateOne(point, center, rot * ang));
          }
          return result;
      }

      function mirrorPoint(point, mirrorX, mirrorY, center, result = {}) {
        result.x = (point.x - center.x) * (mirrorX ? -1 : 1) + center.x;
        result.y = (point.y - center.y) * (mirrorY ? -1 : 1) + center.y;
        return result;
      }

      function mirrorAll(array, steps, result = []) {
        for (let i = 0; i < slices; i++) {
          result.push(mirrorPoint({x: array[i].x, y:  array[i].y}, true, false, center))
        }
        return result;
      }

      const startPoints = rotateAll({x: startX, y: startY}, slices);
      const endPoints = rotateAll({x: endX, y: endY}, slices);

      const mirrorStartPoints = mirrorAll(startPoints, slices);
      const mirrorEndPoints = mirrorAll(endPoints, slices);

      ctx.putImageData(imageData, 0, 0);
      if (tinyDevice) {
        ctx.lineWidth = 2;
      } else if (smallDevice) {
        ctx.lineWidth = 3;
      } else {
        ctx.lineWidth = 4;
      }
      ctx.lineCap = "round";
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endX, endY);

      //draw line 2
      ctx.moveTo(startPoints[1].x, startPoints[1].y);
      ctx.lineTo(endPoints[1].x, endPoints[1].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endPoints[1].x, endPoints[1].y);

      //draw line 3
      ctx.moveTo(startPoints[2].x, startPoints[2].y);
      ctx.lineTo(endPoints[2].x, endPoints[2].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endPoints[2].x, endPoints[2].y);

      //draw line 4
      ctx.moveTo(startPoints[3].x, startPoints[3].y);
      ctx.lineTo(endPoints[3].x, endPoints[3].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endPoints[3].x, endPoints[3].y);

      //draw line 5
      ctx.moveTo(startPoints[4].x, startPoints[4].y);
      ctx.lineTo(endPoints[4].x, endPoints[4].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endPoints[4].x, endPoints[4].y);

      //draw line 6
      ctx.moveTo(startPoints[5].x, startPoints[5].y);
      ctx.lineTo(endPoints[5].x, endPoints[5].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endPoints[5].x, endPoints[5].y);

      //draw mirror line 1
      ctx.moveTo(mirrorStartPoints[0].x, mirrorStartPoints[0].y);
      ctx.lineTo(mirrorEndPoints[0].x, mirrorEndPoints[0].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[0].x, mirrorEndPoints[0].y);

      //draw mirror line 2
      ctx.moveTo(mirrorStartPoints[1].x, mirrorStartPoints[1].y);
      ctx.lineTo(mirrorEndPoints[1].x, mirrorEndPoints[1].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[1].x, mirrorEndPoints[1].y);

      //draw mirror line 3
      ctx.moveTo(mirrorStartPoints[2].x, mirrorStartPoints[2].y);
      ctx.lineTo(mirrorEndPoints[2].x, mirrorEndPoints[2].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[2].x, mirrorEndPoints[2].y);

      //draw mirror line 4
      ctx.moveTo(mirrorStartPoints[3].x, mirrorStartPoints[3].y);
      ctx.lineTo(mirrorEndPoints[3].x, mirrorEndPoints[3].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[3].x, mirrorEndPoints[3].y);

      //draw mirror line 5
      ctx.moveTo(mirrorStartPoints[4].x, mirrorStartPoints[4].y);
      ctx.lineTo(mirrorEndPoints[4].x, mirrorEndPoints[4].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[4].x, mirrorEndPoints[4].y);

      //draw mirror line 6
      ctx.moveTo(mirrorStartPoints[5].x, mirrorStartPoints[5].y);
      ctx.lineTo(mirrorEndPoints[5].x, mirrorEndPoints[5].y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mirrorEndPoints[5].x, mirrorEndPoints[5].y);
    }
  };

})( $ ) );

(function init () {
  $(document).ready((function() {
    $(".canvas-wrapper").canvasTest();
  }));
})();
