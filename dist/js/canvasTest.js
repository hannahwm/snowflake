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
      saveBtn: "#save"
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

      self.$saveBtn = self.$container.find(self.options.saveBtn);
      // self.canvas = document.getElementById(self.options.canvasId);
      // self.ctx = self.canvas.getContext("2d");
      drawing = false;
      startX = 0;
      startY = 0;
      imageData = null;
    },
    bindEvents: function() {
      const self = this;
      const canvas = document.getElementById(self.options.canvasId);

      //eventListeners
      canvas.addEventListener("mousedown", self.startPosition);
      canvas.addEventListener("mouseup", self.endPosition);
      canvas.addEventListener("mousemove", self.draw);

    	$(self.options.saveBtn).on("click", (function(e) {
    			Canvas2Image.saveAsImage(canvas, 600, 600, "jpeg");
    	}));
    },
    startPosition: function(e) {
      const self = this;
      const canvas = this;
      const ctx = canvas.getContext("2d");

      startX = e.clientX;
      startY = e.clientY;
      imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      drawing = true;
    },
    endPosition: function(e) {
      const self = this;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.moveTo(startX, startY);
      ctx.lineTo(e.clientX, e.clientY);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.beginPath();

      drawing = false;
    },
    draw: function(e) {
      const self = this;
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      if(!drawing) {
        return;
      }

      const center = {x: 300, y: 300};
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
      const endPoints = rotateAll({x: e.clientX, y: e.clientY}, slices);

      const mirrorStartPoints = mirrorAll(startPoints, slices);
      const mirrorEndPoints = mirrorAll(endPoints, slices);

      // const mirror1start = mirrorPoint({x: startPoints[0].x, y:  startPoints[0].y}, true, false, center);
      //
      // const mirror1end = mirrorPoint({x: endPoints[0].x, y:  endPoints[0].y}, true, false, center);

      ctx.putImageData(imageData, 0, 0);
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.moveTo(startX, startY);
      ctx.lineTo(e.clientX, e.clientY);
      // ctx.moveTo(startX, startY);
      // ctx.lineTo(e.clientX - 50, e.clientY);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.clientX, e.clientY);

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
