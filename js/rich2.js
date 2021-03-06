
var CanvasWidth = 640;
var CanvasHeight = 480;
var GridLength = 48; // The width of each block in game
var MapViewLength = 432; // The partial map that player can see, the length is 9x48=432 px
var MapViewHalfLength = 192;
var MapImgLength = 216;
var MenuOptionHeight = 48;
var MenuOptionWidth = 86;
var SideBarWidth = 208; // Left side bar
var CursorMovement = 45;
var AnimationTimeout = 20; // 50 FPS
var HeadImgLength = 40;
var BodyImgLength = 52;
var HeadOffset = 27;
var SpeedDelta = 3;
var DiceWidth = 54;
var DiceHeight = 72;
var mapOffsetX = 0;
var mapOffsetY = 0;
var ChanceImgWidth = 176;
var ChanceImgHeight = 146;
var ChanceDisplayWidth = 352;
var ChanceDisplayHeight = 291;
var NumOfChances = 20;
var NumOfCards = 36;
var CoverImg = loadImage("topoverlays.png");
var CursorImg = loadImage("mouse.png");
var DiceImg = loadImage("dice.png");
var LandLabelImg = loadImage("landlabel.png");
var LandMarkersImg = loadImage("landmarker.png");
var MenuSelectedImg = loadImage("menuselected.png");
var HeadImg = loadImage("head.png");
var CarImg = loadImage("car.png");
var BldgImg = loadImage("bldg.png");
var AbacusImg = loadImage("abacus.png");
var ChanceImg = loadImage("chance.png");
var CasinoImg = loadImage("casino.png");
var CoinImg = loadImage("coin.png");
var BubbleImg = loadImage("bubble.png");
var WinImg = loadImage("winning.png"); // Including dollar background image
var StockImg = loadImage("stock.png");
var BuddhaImg = loadImage("buddha.png");
var BldgUpgradeMsg = [
  "加蓋平房","改建店鋪","擴建商場","蓋商業大樓","建摩天大廈"
];
var AnchorImg = loadImage("anchor.png");

var bag1Audio = new Audio("audio/bag1.ogg");
var bag2Audio = new Audio("audio/bag2.ogg");
bag1Audio.addEventListener('ended', function() {
  bag2Audio.play();
});
bag2Audio.addEventListener('ended', function() {
  bag1Audio.play();
});
bag1Audio.play();
var CursorPositions = [
  {x: 251, y: 45}, // default
  {x: 251, y: 45}, // Court
  {x: 562, y: 26}, // Stock
  {x: 251, y: 45}, // Chance
  {x: 251, y: 45}, // News
  {x: 251, y: 45}, // Tax
  {x: 200, y: 354}, // Casino
  {x: 251, y: 45}, // Park
  {x: 251, y: 45}, // CommunityChest
  {x: 251, y: 45}, // Carnival
  {x: 251, y: 45}, // Hospital
  {x: 251, y: 45}, // Jail
  {x: 251, y: 45}, // Bank
  {x: 251, y: 45}, // Market
  {x: 251, y: 45}, // Road
  {x: 508, y: 224}, // Road with land
  {x: 480, y: 159}, // Passing Bank
  {x: 251, y: 45} // Monthly Report
];

function loadImage(imgURL) {
  var image = new Image();
  image.src = "image/" + imgURL;
  return image;
}

function isPtInside(x, y, dx, dy, px, py) {
  if (px < x || px >= x + dx || py < y || py >= y + dy) {
    return false;
  }
  return true;
}

/**
 * Returns from 0 - 5
 */
function dice() {
  return Math.floor(Math.random() * 6);
}

$(function() {
  
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext('2d');
  var cursorPos = {x:CursorPositions[0].x, y:CursorPositions[0].y}; // Pointing at MenuOption "Move On" initially
  var soldLands;
  var bldgLands;
  var currentLevel;
  var mapSize;
  var mapInfo;
  var mapImg;
  var playerList;
  var currentPlayer;
  var currentPlayerIndex;
  var maxNumOfPlayers;
  var cityList;
  var stockList;
  var passedBank = false;
  var monthlyScreenImg = null;
  var landList;

  function drawMap(cx, cy) {
    var llx = cx - MapViewHalfLength;
    var rrx = currentLevel.MapLength - (cx + GridLength) - MapViewHalfLength;
    var uuy = cy - MapViewHalfLength;
    var ddy = currentLevel.MapLength - (cy + GridLength) - MapViewHalfLength;
    if (llx < 0) {
      mapOffsetX = 0;
    } else if (llx >= 0 && rrx >=0) {
      mapOffsetX = llx;
    } else {
      mapOffsetX = currentLevel.MapLength - MapViewLength;
    }
    if (uuy < 0) {
      mapOffsetY = 0;
    } else if (uuy >= 0 && ddy >=0) {
      mapOffsetY = uuy;
    } else {
      mapOffsetY = currentLevel.MapLength - MapViewLength;
    }
    context.drawImage(mapImg, mapOffsetX/2, mapOffsetY/2, MapViewLength/2, MapViewLength/2, 
        SideBarWidth, MenuOptionHeight, MapViewLength, MapViewLength);
    
    // Find which bought lands need to be displayed
    var gameX = Math.floor(cx / GridLength);
    var gameY = Math.floor(cy / GridLength);
    var lx = gameX - 5;
    if (lx < 0) {
      lx = 0;
    }
    var rx = lx + 10;
    if (rx >= mapSize) {
      rx = mapSize - 1;
      lx = rx - 10;
    }
    var ty = gameY - 5;
    if (ty < 0) {
      ty = 0;
    }
    var by = ty + 10;
    if (by >= mapSize) {
      by = mapSize - 1;
      ty = by - 10;
    }
    for (var i=lx; i<=rx; ++i) {
      var array = soldLands[i];
      for (var j in array) {
        var block = array[j];
        var ly = block.ly;
        if (ty <= ly && ly <= by) {
          var owner = block.owner;
          var x = SideBarWidth + block.mx - mapOffsetX;
          var y = MenuOptionHeight + block.my - mapOffsetY;
          context.drawImage(LandMarkersImg, owner * GridLength, 0, GridLength, GridLength,
            x, y, GridLength, GridLength);
        }
      }
    }
    for (var i=lx; i<=rx; ++i) {
      var array = bldgLands[i];
      for (var j in array) {
        var block = array[j];
        var ly = block.ly;
        if (ty <= ly && ly <= by) {
          var owner = block.owner;
          var x = SideBarWidth + block.mx - mapOffsetX;
          var y = MenuOptionHeight + block.my - mapOffsetY;
          context.drawImage(BldgImg, GridLength * (block.bldg - 1), 0, GridLength, GridLength,
            x, y, GridLength, GridLength);
        }
      }
    }
  }
  
  function drawSidebar() {
    context.drawImage(CoverImg, 0, 0, 320, 240, 0, 0, 640, 480);
    // Date
    context.font = "30px sans-serif";
    context.fillStyle = "black";
    context.fillText(Game.year, 75, 48);
    context.fillText(Game.month + "   " + Game.day, 83, 98);
    // Name
    context.font = "45px sans-serif";
    context.fillStyle = 'gold';
    context.fillText(currentPlayer.name, 25, 176);
    // Money
    context.font = "32px sans-serif";
    context.fillStyle = 'yellow';
    context.fillText(currentPlayer.cash, 90, 228);
    context.fillText(currentPlayer.deposit, 90, 275);
  }

  function drawPlayer() {
    drawBuddha();
    for (var i=playerList.length-1; i>=0; --i) { // Should change the order, top ones first, bottom ones last
      var playername = playerList[i];
      var player = Players[playername];
      if (!player.alive || player === currentPlayer) continue;
      var dir = player.gamePos.d;
      var playerposition = player.position;
      var x = SideBarWidth + playerposition.x - mapOffsetX;
      var y = MenuOptionHeight + playerposition.y - mapOffsetY;
      if (mapInfo[player.gamePos.bid].t != 14) { // If player is not in the sea
        context.drawImage(CarImg, dir * 52, 0, 52, 52, x, y, 52, 52);
      }
      context.drawImage(HeadImg, player.id * 168 + dir * 42, 0, 42, 42, x, y - HeadOffset, 42, 42); // 168 = 42 * 4
    }
    var d = currentPlayer.gamePos.d;
    var pos = currentPlayer.position;
    var cx = SideBarWidth + pos.x - mapOffsetX;
    var cy = MenuOptionHeight + pos.y - mapOffsetY;
    if (mapInfo[currentPlayer.gamePos.bid].t == 14) {
      context.drawImage(CarImg, 208 + (d - 1) * 52, 0, 52, 52, cx, cy, 52, 52);
      return;
    }
    context.drawImage(CarImg, d * 52, 0, 52, 52, cx, cy, 52, 52);
    context.drawImage(HeadImg, currentPlayer.id * 168 + d * 42, 0, 42, 42,
       cx, cy - HeadOffset, 42, 42); // 168 = 42 * 4
  }

  function drawBuddha() {
    for (var i=0; i<4; ++i) {
      context.drawImage(BuddhaImg, 48 * i, 0, 48, 48, 
        SideBarWidth + buddhaPositions[i].x - mapOffsetX, 
        MenuOptionHeight + buddhaPositions[i].y - mapOffsetY, 48, 48);
      //context.drawImage(BuddhaImg, 48 * i, 0, 48, 48, );
    }
  }

  function drawCursor() {
    context.drawImage(CursorImg, cursorPos.x, cursorPos.y);
  }
  
  function drawDice(d1, d2) {
    context.drawImage(DiceImg, 54 * d1, 0, 54, 72, 55, 336, 54, 72);
    context.drawImage(DiceImg, 54 * d2, 0, 54, 72, 119, 336, 54, 72);
  } 
  
  function screenSnapshot() {
    monthlyScreenImg = context.getImageData(0, 0, CanvasWidth, CanvasHeight)
    for (var i=0; i<monthlyScreenImg.height; ++i) {
      for (var j=0; j<monthlyScreenImg.width; ++j) {
        var index = (i * 4) * monthlyScreenImg.width + (j * 4);
        var red = monthlyScreenImg.data[index];
        var green = monthlyScreenImg.data[index + 1];
        var blue = monthlyScreenImg.data[index + 2];
        var alpha = monthlyScreenImg.data[index + 3];
        var average = (red + green + blue) / 3;
        monthlyScreenImg.data[index] = average;
        monthlyScreenImg.data[index + 1] = average;
        monthlyScreenImg.data[index + 2] = average;
        monthlyScreenImg.data[index + 3] = alpha;
      }
    }
    console.log("snapshot taken");
  }
  
  function updateStockMarket() {
    // I don't know anything about the stock market rules, so I randomize most data, 
    // and only stablize the trends.
    for (var i=0; i<20; ++i) {
      var stock = stockList[i];
      var dir = stock.moveup;
      var price = stock.price;
      // The volume is faked
      var volume = Math.floor(Math.random() * 18000) + 4000;
      var percent = (Math.random() * 10 - 5) / 100;
      var change;
      if (dir && percent < 0) {
        percent += 2.5; // compensate the loss for no reason
      } else if (!dir && percent > 0) {
        percent -= 2.5;
      }
      var change = price * percent;
      price = parseFloat(price) + change;
      var oriMoveup = stock.moveup;
      var moveup = (Math.random() * 15) < stock.days ? !oriMoveup : oriMoveup;

      stock.volume = volume;
      stock.price = price;
      stock.change = change;
      stock.percent = percent;
      stock.moveup = moveup;
      if (oriMoveup != moveup) {
        stock.days = 1;
      } else {
        ++stock.days;
      }
      console.log(stock);
    }
  }
  
  var buddhaPositions = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}];
  function pickBuddhaPosition(id) {
    while (true) {
      var pos = Math.floor(Math.random() * landList.length);
      var tx = landList[pos].x * 48;
      var ty = landList[pos].y * 48;
      for (var i=0; i<4; ++i) if (i != id) {
        if (buddhaPositions[i].x == tx && buddhaPositions[i].y == ty)
          break;
      }
      if (i == 4) {
        buddhaPositions[id].x = tx;
        buddhaPositions[id].y = ty;
        break;
      }
    }
  }
  
  function initbuddhaPosition() {
    for (var i=0; i<4; ++i) {
      pickBuddhaPosition(i);
    }
  }
  
  var firstMonth = true;
  function turnToNextPlayer() {
    var report = false;
    do {
      ++currentPlayerIndex;
      if (currentPlayerIndex == maxNumOfPlayers) {
        updateStockMarket();
        currentPlayerIndex = 0;
        ++Game.day;
        if (Game.day > Game.Months[Game.month]) {
          report = true;
          if (firstMonth) {
            firstMonth = false;
            initbuddhaPosition();
          }
          Game.day = 1;
          ++Game.month;
          if (Game.month > 12) {
            ++Game.year;
            if (Game.year % 100 == 0 && Game.year % 400 == 0 || Game.year % 100 != 0 && Game.year % 4 == 0) {
              Game.Months = GameDate.Prime;
            } else {
              Game.Months = GameDate.Months;
            }
          }
        }
      }
      currentPlayer = Players[playerList[currentPlayerIndex]];
    } while (!currentPlayer.alive);
    console.log("turn to next player " + currentPlayer.name);
    defaultEntered = false;
    if (report) {
      console.log("Monthly report");
      screenSnapshot();
      Game.status = 17;
    } else {
      cursorPos.x = CursorPositions[0].x;
      cursorPos.y = CursorPositions[0].y;
      Game.status = 0;
    }
  }
  
  var OverObjects = [
  // Default: Menu Options
  [
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 0, 0, 43, 24, 
          SideBarWidth, 0, MenuOptionWidth, MenuOptionHeight);
      },
      x: SideBarWidth,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
        Players.dice();
      }
    },
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 43, 0, 43, 24, 
          SideBarWidth + MenuOptionWidth, 0, MenuOptionWidth, MenuOptionHeight);        
      },
      x: SideBarWidth + MenuOptionWidth,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
        drawStockBoard();
      }
    },
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 86, 0, 43, 24, 
          SideBarWidth + MenuOptionWidth * 2, 0, MenuOptionWidth, MenuOptionHeight);
      },
      x: SideBarWidth + MenuOptionWidth * 2,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
        console.log("[MenuAction] Cards");
      }
    },
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 129, 0, 43, 24, 
          SideBarWidth + MenuOptionWidth * 3, 0, MenuOptionWidth, MenuOptionHeight);
      },
      x: SideBarWidth + MenuOptionWidth * 3,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
        console.log("[MenuAction] Progress");
      }
    },
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 172, 0, 43, 24, 
          SideBarWidth + MenuOptionWidth * 4, 0, MenuOptionWidth, MenuOptionHeight);        
      },
      x: SideBarWidth + MenuOptionWidth * 4,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
        console.log("[MenuAction] Others");
      }
    }
  ],
  [/*Court*/],
  [/*Stock*/],
  null, // Chance
  null, // News
  null, // Tax
  [],   // Casino
  null, // Park
  null, // CommunityChest
  null, // Carnival
  null, // Hospital
  null, // Jail
  [],   // Bank
  [],   // Market
  [
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 0, 0, MenuOptionWidth, MenuOptionHeight, 
          SideBarWidth, 0, MenuOptionWidth, MenuOptionHeight);
      },
      x: SideBarWidth,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
      }
    },
    {
      drawSelected: function() {
        context.drawImage(MenuSelectedImg, 0, 0, MenuOptionWidth, MenuOptionHeight, 
          SideBarWidth, 0, MenuOptionWidth, MenuOptionHeight);
      },
      x: SideBarWidth,
      y: 0,
      width: MenuOptionWidth,
      height: MenuOptionHeight,
      action: function() {
      }
    }
  ]    
  ];

  function checkPlayerCashFlow(player) {
    if (player.cash < 0) {
      player.deposit += player.cash;
      player.cash = 0;
      if (player.deposit <= 0) {
        player.alive = false;
        console.log(player.name + " is bankrupt");
      }
    }
  }

  var Levels = {
    taiwan: {
      playerList: ["atuzai", "dalaoqian", "sunxiaomei", "qianfuren"],
      mapInfo: {"1":{"x":20,"y":7,"s":0,"t":2,"n":{"3":2}},
      "2":{"x":20,"y":8,"s":1,"t":15,"n":{"3":3},"lx":19,"ly":8,"c":"taoyuan"},"3":{"x":20,"y":9,"s":1,"t":15,"n":{"3":4},"lx":19,"ly":9,"c":"taoyuan"},"4":{"x":20,"y":10,"s":1,"t":15,"n":{"3":5},"lx":19,"ly":10,"c":"taoyuan"},"5":{"x":20,"y":11,"s":1,"t":3,"n":{"1":148,"2":97}},"6":{"x":19,"y":12,"s":0,"t":3,"n":{"0":148,"3":7}},"7":{"x":19,"y":13,"s":1,"t":15,"n":{"0":6,"3":8},"lx":20,"ly":13,"c":"xinzhu"},"8":{"x":19,"y":14,"s":1,"t":15,"n":{"0":7,"3":9},"lx":20,"ly":14,"c":"xinzhu"},"9":{"x":19,"y":15,"s":1,"t":15,"n":{"0":8,"3":10},"lx":20,"ly":15,"c":"xinzhu"},"10":{"x":19,"y":16,"s":1,"t":12,"n":{"0":9,"3":11,"1":98,"2":126}},"11":{"x":19,"y":17,"s":0,"t":12,"n":{"0":10,"3":12}},"126":{"x":20,"y":16,"s":0,"t":12,"n":{"1":10,"2":127}},"12":{"x":19,"y":18,"s":1,"t":15,"n":{"0":11,"3":13},"lx":20,"ly":18,"c":"jiayi"},"13":{"x":19,"y":19,"s":1,"t":15,"n":{"0":12,"3":14},"lx":20,"ly":19,"c":"jiayi"},"14":{"x":19,"y":20,"s":1,"t":15,"n":{"0":13,"3":15},"lx":20,"ly":20,"c":"jiayi"},"15":{"x":19,"y":21,"s":0,"t":2,"n":[14,16]},"16":{"x":18,"y":21,"s":1,"t":2,"n":{"3":26,"1":17,"2":15}},"26":{"x":18,"y":22,"s":0,"t":2,"n":{"0":16,"3":27}},"17":{"x":17,"y":21,"s":1,"t":15,"n":{"1":18},"lx":17,"ly":20,"c":"tainan"},"18":{"x":16,"y":21,"s":1,"t":15,"n":{"1":19},"lx":16,"ly":20,"c":"tainan"},"19":{"x":15,"y":21,"s":1,"t":15,"n":{"1":20},"lx":15,"ly":20,"c":"tainan"},"20":{"x":14,"y":21,"s":1,"t":5,"n":{"3":22}},"21":{"x":13,"y":21,"s":0,"t":5,"n":{"2":20}},"22":{"x":14,"y":22,"s":1,"t":6,"n":{"0":20,"2":23}},"23":{"x":15,"y":22,"s":1,"t":15,"n":{"2":24},"lx":15,"ly":23,"c":"tainan"},"24":{"x":16,"y":22,"s":1,"t":15,"n":{"2":25},"lx":16,"ly":23,"c":"tainan"},"25":{"x":17,"y":22,"s":1,"t":15,"n":{"2":26},"lx":17,"ly":23,"c":"tainan"},"27":{"x":18,"y":23,"s":1,"t":15,"n":{"0":26,"3":28},"lx":19,"ly":23,"c":"gaoxiong"},"28":{"x":18,"y":24,"s":1,"t":15,"n":{"0":27,"3":29},"lx":19,"ly":24,"c":"gaoxiong"},"29":{"x":18,"y":25,"s":1,"t":15,"n":{"0":28,"3":30},"lx":19,"ly":25,"c":"gaoxiong"},"30":{"x":18,"y":26,"s":1,"t":15,"n":{"0":29,"3":31},"lx":19,"ly":26,"c":"gaoxiong"},"31":{"x":18,"y":27,"s":0,"t":13,"n":{"0":30,"3":149}},"32":{"x":19,"y":28,"s":1,"t":13,"n":{"1":149,"3":33}},"33":{"x":19,"y":29,"s":1,"t":15,"n":{"0":32,"3":34},"lx":18,"ly":29,"c":"pingdong"},"34":{"x":19,"y":30,"s":1,"t":15,"n":{"0":33,"3":35},"lx":18,"ly":30,"c":"pingdong"},"35":{"x":19,"y":31,"s":1,"t":15,"n":{"0":34,"3":36},"lx":18,"ly":31,"c":"pingdong"},"36":{"x":19,"y":32,"s":1,"t":2,"n":{"0":35,"2":37}},"37":{"x":20,"y":32,"s":0,"t":2,"n":{"1":36,"2":38}},"38":{"x":21,"y":32,"s":0,"t":9,"n":{"1":37,"2":39}},"39":{"x":22,"y":32,"s":1,"t":9,"n":[40,38]},"40":{"x":22,"y":31,"s":1,"t":15,"n":{"0":41,"3":39},"lx":23,"ly":31,"c":"eluanbi"},"41":{"x":22,"y":30,"s":1,"t":15,"n":{"0":42,"3":40},"lx":23,"ly":30,"c":"eluanbi"},"42":{"x":22,"y":29,"s":1,"t":15,"n":{"0":43,"3":41},"lx":23,"ly":29,"c":"eluanbi"},"43":{"x":22,"y":28,"s":0,"t":4,"n":{"3":42,"0":150}},"44":{"x":23,"y":27,"s":1,"t":4,"n":{"1":150,"2":45}},"45":{"x":24,"y":27,"s":1,"t":8,"n":{"1":44,"2":46}},"46":{"x":25,"y":27,"s":0,"t":8,"n":[47,45]},"47":{"x":25,"y":26,"s":1,"t":15,"n":{"0":48,"3":46},"lx":26,"ly":26,"c":"taidong"},"48":{"x":25,"y":25,"s":1,"t":15,"n":{"0":49,"3":47},"lx":26,"ly":25,"c":"taidong"},"49":{"x":25,"y":24,"s":1,"t":15,"n":{"0":50,"3":48},"lx":26,"ly":24,"c":"taidong"},"50":{"x":25,"y":23,"s":1,"t":15,"n":{"0":51,"3":49},"lx":26,"ly":23,"c":"taidong"},"51":{"x":25,"y":22,"s":1,"t":3,"n":{"0":52,"3":50}},"52":{"x":25,"y":21,"s":0,"t":3,"n":{"0":53,"3":51}},"53":{"x":25,"y":20,"s":1,"t":15,"n":{"0":54,"3":52},"lx":26,"ly":20,"c":"hualian"},"54":{"x":25,"y":19,"s":1,"t":15,"n":{"0":55,"3":53},"lx":26,"ly":19,"c":"hualian"},"55":{"x":25,"y":18,"s":1,"t":15,"n":{"0":56,"3":54},"lx":26,"ly":18,"c":"hualian"},"56":{"x":25,"y":17,"s":1,"t":7,"n":{"3":55,"1":130,"2":57}},"130":{"x":24,"y":16,"s":0,"t":7,"n":{"1":129,"2":56}},"57":{"x":26,"y":17,"s":1,"t":15,"n":{"1":56,"2":58},"lx":26,"ly":16,"c":"tailuge"},"58":{"x":27,"y":17,"s":1,"t":15,"n":{"1":57,"2":59},"lx":27,"ly":16,"c":"tailuge"},"59":{"x":28,"y":17,"s":1,"t":15,"n":{"1":58,"2":60},"lx":28,"ly":16,"c":"tailuge"},"60":{"x":29,"y":17,"s":0,"t":2,"n":{"2":147,"1":59}},"61":{"x":30,"y":16,"s":1,"t":2,"n":{"0":62,"3":147}},"62":{"x":30,"y":15,"s":1,"t":15,"n":{"0":63,"3":61},"lx":29,"ly":15,"c":"suao"},"63":{"x":30,"y":14,"s":1,"t":15,"n":{"0":64,"3":62},"lx":29,"ly":14,"c":"suao"},"64":{"x":30,"y":13,"s":1,"t":15,"n":{"0":65,"3":63},"lx":29,"ly":13,"c":"suao"},"65":{"x":30,"y":12,"s":1,"t":15,"n":{"0":66,"3":64},"lx":29,"ly":12,"c":"suao"},"66":{"x":30,"y":11,"s":0,"t":3,"n":{"2":146,"3":65}},"67":{"x":31,"y":10,"s":1,"t":3,"n":{"0":68,"3":146}},"68":{"x":31,"y":9,"s":1,"t":15,"n":{"0":69,"3":67},"lx":30,"ly":9,"c":"yilan"},"69":{"x":31,"y":8,"s":1,"t":15,"n":{"0":70,"3":68},"lx":30,"ly":8,"c":"yilan"},"70":{"x":31,"y":7,"s":1,"t":15,"n":{"0":71,"3":69},"lx":30,"ly":7,"c":"yilan"},"71":{"x":31,"y":6,"s":1,"t":15,"n":{"0":72,"3":70},"lx":30,"ly":6,"c":"yilan"},"72":{"x":31,"y":5,"s":1,"t":6,"n":{"0":73,"3":71}},"73":{"x":31,"y":4,"s":0,"t":6,"n":{"0":74,"3":72}},"74":{"x":31,"y":3,"s":1,"t":2,"n":{"3":73,"1":75}},"75":{"x":30,"y":3,"s":1,"t":15,"n":{"1":76,"2":74},"lx":30,"ly":4,"c":"jilong"},"76":{"x":29,"y":3,"s":1,"t":15,"n":{"1":77,"2":75},"lx":29,"ly":4,"c":"jilong"},"77":{"x":28,"y":3,"s":1,"t":15,"n":{"1":78,"2":76},"lx":28,"ly":4,"c":"jilong"},"78":{"x":27,"y":3,"s":1,"t":8,"n":{"1":79,"2":77}},"79":{"x":26,"y":4,"s":0,"t":8,"n":{"3":80,"2":78}},"80":{"x":26,"y":5,"s":1,"t":7,"n":{"0":79,"1":81,"3":145}},"81":{"x":25,"y":5,"s":1,"t":15,"n":{"1":82,"2":80},"lx":25,"ly":4,"c":"taipei"},"82":{"x":24,"y":5,"s":1,"t":15,"n":{"1":83,"2":81},"lx":24,"ly":4,"c":"taipei"},"83":{"x":23,"y":5,"s":1,"t":15,"n":{"1":84,"2":82},"lx":23,"ly":4,"c":"taipei"},"84":{"x":22,"y":5,"s":1,"t":15,"n":{"1":85,"2":83},"lx":22,"ly":4,"c":"taipei"},"85":{"x":21,"y":5,"s":1,"t":1,"n":{"3":88,"2":84}},"88":{"x":21,"y":6,"s":1,"t":2,"n":{"3":1,"2":89}},"93":{"x":21,"y":7,"s":0,"t":2,"n":[88]},"94":{"x":21,"y":8,"s":1,"t":15,"n":[93],"lx":22,"ly":8,"c":"taoyuan"},"95":{"x":21,"y":9,"s":1,"t":15,"n":[94],"lx":22,"ly":9,"c":"taoyuan"},"96":{"x":21,"y":10,"s":1,"t":15,"n":[95],"lx":22,"ly":10,"c":"taoyuan"},"97":{"x":21,"y":11,"s":1,"t":4,"n":[96]},"98":{"x":18,"y":16,"s":1,"t":15,"n":{"1":99,"2":10},"lx":18,"ly":15,"c":"taizhong"},"99":{"x":17,"y":16,"s":1,"t":15,"n":{"1":100,"2":98},"lx":17,"ly":15,"c":"taizhong"},"100":{"x":16,"y":16,"s":1,"t":15,"n":{"1":101,"2":99},"lx":16,"ly":15,"c":"taizhong"},"101":{"x":15,"y":16,"s":0,"t":8,"n":{"1":102,"2":100}},"102":{"x":14,"y":16,"s":1,"t":8,"n":{"3":139,"1":103,"2":101}},"139":{"x":14,"y":17,"s":1,"t":15,"n":{"0":102,"3":140},"lx":13,"ly":17,"c":"yunlin"},"140":{"x":14,"y":18,"s":1,"t":15,"n":{"0":139,"3":141},"lx":13,"ly":18,"c":"yunlin"},"141":{"x":14,"y":19,"s":1,"t":15,"n":{"0":140,"3":142},"lx":13,"ly":19,"c":"yunlin"},"142":{"x":14,"y":20,"s":0,"t":5,"n":{"0":141,"3":20}},"103":{"x":13,"y":16,"s":0,"t":14,"n":{"1":104}},"104":{"x":12,"y":16,"s":1,"t":14,"n":{"1":105}},"105":{"x":11,"y":16,"s":1,"t":14,"n":{"1":106}},"106":{"x":10,"y":16,"s":1,"t":14,"n":{"1":107}},"107":{"x":9,"y":16,"s":1,"t":14,"n":{"1":108}},"108":{"x":8,"y":16,"s":1,"t":14,"n":{"1":109}},"109":{"x":7,"y":16,"s":1,"t":14,"n":{"1":110}},"110":{"x":6,"y":16,"s":1,"t":14,"n":{"1":111}},"116":{"x":3,"y":18,"s":1,"t":14,"n":{"2":117}},"117":{"x":4,"y":19,"s":1,"t":14,"n":{"2":118}},"118":{"x":5,"y":20,"s":1,"t":14,"n":{"2":119}},"119":{"x":6,"y":21,"s":1,"t":14,"n":{"2":120}},"120":{"x":7,"y":21,"s":1,"t":14,"n":{"2":121}},"121":{"x":8,"y":21,"s":1,"t":14,"n":{"2":122}},"122":{"x":9,"y":21,"s":1,"t":14,"n":{"2":123}},"123":{"x":10,"y":21,"s":1,"t":14,"n":{"2":124}},"124":{"x":11,"y":21,"s":1,"t":14,"n":{"2":125}},"125":{"x":12,"y":21,"s":0,"t":14,"n":{"2":21}},"111":{"x":5,"y":16,"s":1,"t":15,"n":{"1":112},"lx":5,"ly":15,"c":"penghu"},"112":{"x":4,"y":16,"s":1,"t":15,"n":{"1":113},"lx":4,"ly":15,"c":"penghu"},"113":{"x":3,"y":16,"s":1,"t":15,"n":{"1":114},"lx":3,"ly":15,"c":"penghu"},"114":{"x":2,"y":16,"s":0,"t":8,"n":{"3":115}},"115":{"x":2,"y":17,"s":1,"t":8,"n":{"2":116}},"127":{"x":21,"y":16,"s":1,"t":15,"n":{"1":126,"2":128},"lx":21,"ly":17,"c":"nantou"},"128":{"x":22,"y":16,"s":1,"t":15,"n":{"1":127,"2":129},"lx":22,"ly":17,"c":"nantou"},"129":{"x":23,"y":16,"s":1,"t":15,"n":{"1":128,"2":130},"lx":23,"ly":17,"c":"nantou"},"131":{"x":24,"y":14,"s":0,"t":11,"n":[]},"132":{"x":25,"y":14,"s":0,"t":11,"n":[]},"133":{"x":24,"y":13,"s":0,"t":11,"n":[]},"134":{"x":25,"y":13,"s":0,"t":11,"n":[]},"135":{"x":22,"y":25,"s":0,"t":10,"n":[]},"136":{"x":23,"y":25,"s":0,"t":10,"n":[]},"137":{"x":22,"y":24,"s":0,"t":10,"n":[]},"138":{"x":23,"y":24,"s":0,"t":10,"n":[]},"86":{"x":20,"y":5,"s":1,"t":1,"n":{"3":87}},"87":{"x":20,"y":6,"s":1,"t":2,"n":{"3":1}},"89":{"x":22,"y":6,"s":1,"t":15,"n":{"1":88,"2":90},"lx":22,"ly":7,"c":"taipei"},"90":{"x":23,"y":6,"s":1,"t":15,"n":{"1":89,"2":91},"lx":23,"ly":7,"c":"taipei"},"91":{"x":24,"y":6,"s":1,"t":15,"n":{"1":90,"2":92},"lx":24,"ly":7,"c":"taipei"},"92":{"x":25,"y":6,"s":1,"t":15,"n":{"2":145,"1":91},"lx":25,"ly":7,"c":"taipei"},"143":{"x":20,"y":4,"s":1,"t":1,"n":{"3":86}},"144":{"x":27,"y":4,"s":1,"t":8,"n":{"2":77}},"145":{"x":26,"y":6,"t":7,"s":0,"n":{"2":151,"1":92}},"146":{"x":31,"y":11,"s":0,"t":3,"n":[67,66]},"147":{"x":30,"y":17,"s":0,"t":2,"n":[61,60]},"148":{"x":19,"y":11,"s":0,"t":3,"n":{"2":5,"3":6}},"149":{"x":18,"y":28,"s":0,"t":13,"n":{"0":31,"2":32}},"150":{"x":22,"y":27,"s":0,"t":4,"n":{"3":43,"2":44}},"151":{"x":27,"y":5,"s":0,"t":7,"n":[144,145]}}
      ,
        
      mapImg: loadImage("taiwan.png"),
      mapSize: 36, // There are 36x36 blocks in the map
      MapLength: 1728, 
      startPos: [{bid: 1, d: 3}, {bid: 87, d: 3}, {bid: 86, d: 3}, {bid: 143, d: 3}],
      cityList: {
        nantou: {
          price: 500, upgrade: 80,
          rent: [100, 300, 750, 1500, 0, 0],
          blocks: [127, 128, 129],
          display: "南投縣"
        },
        taidong: {
          price: 1000, upgrade: 150,
          rent: [200, 600, 1500, 0, 0, 0],
          blocks: [47, 48, 49, 50],
          display: "台東縣"
        },
        taizhong: {
          price: 1400, upgrade: 200,
          rent: [250, 800, 0, 0, 0, 0],
          blocks: [98, 99, 100],
          display: "台中市"
        },
        taipei: {
          price: 2500, upgrade: 400,
          rent: [500, 1500, 3750, 0, 0, 0],
          blocks: [84, 83, 82, 81, 89, 90, 91, 92],
          display: "台北市"
        },
        tainan: {
          price: 2000, upgrade: 250,
          rent: [400, 1200, 3000, 8800, 0, 0],
          blocks: [17, 18, 19, 23, 24, 25],
          display: "台南市"
        },
        jilong: {
          price: 2000, upgrade: 300,
          rent: [400, 1200, 3000, 6000, 0, 16000],
          blocks: [75, 76, 77],
          display: "基隆市"
        },
        tailuge: {
          price: 900, upgrade: 100,
          rent: [160, 550, 1250, 2500, 0, 0],
          blocks: [57, 58, 59],
          display: "太魯閣"
        },
        yilan: {
          price: 1200, upgrade: 160,
          rent: [230, 700, 1600, 3000, 5000, 8000],
          blocks: [68, 69, 70, 71],
          display: "宜蘭縣"
        },
        pingdong: {
          price: 1400, upgrade: 200, 
          rent: [250, 800, 2000, 4000, 7000, 0],
          blocks: [33, 34, 35],
          display: "屏東縣"
        },
        xinzhu: {
          price: 1600, upgrade: 200,
          rent: [300, 900, 0, 0, 0, 0],
          blocks: [7, 8, 9],
          display: "新竹市"
        },
        taoyuan: {
          price: 2200, upgrade: 340,
          rent: [440, 1300, 3200, 6400, 10500, 0],
          blocks: [2, 3, 4, 96, 95, 94],
          display: "桃園縣"
        },
        penghu: {
          price: 600, upgrade: 100,
          rent: [100, 300, 0, 0, 0, 0],
          blocks: [11, 12, 13],
          display: "澎 湖"
        },
        hualian: {
          price: 1500, upgrade: 180,
          rent: [300, 900, 2000, 4200, 7000, 0],
          blocks: [53, 54, 55],
          display: "花蓮縣"
        },
        suao: {
          price: 800, upgrade: 100,
          rent: [150, 500, 1100, 2200, 0, 0],
          blocks: [62, 63, 64, 65],
          display: "蘇 澳"
        },
        yunlin: {
          price: 1600, upgrade: 200,
          rent: [300, 900, 0, 0, 0, 0],
          blocks: [139, 140, 141],
          display: "雲林縣"
        },
        gaoxiong: {
          price: 2300, upgrade: 360,
          rent: [450, 1300, 4000, 6000, 0, 0],
          blocks: [27, 28, 29, 30],
          display: "高雄市"
        },
        eluanbi: {
          price: 700, upgrade: 100,
          rent: [140, 400, 0, 0, 0, 0],
          blocks: [40, 41, 42],
          display: "鹅栾鼻"
        },
        jiayi: {
          price: 1500, upgrade: 180,
          rent: [300, 900, 2000, 0, 0, 7000],
          blocks: [12, 13, 14],
          display: "嘉義市"
        }
      },
      stockList: ["中  鋼", "華  隆", "台  泥", "聲  寶", "大  同", "台  塑", "國  泰", "新  光", "统  一", 
                  "味  全", "遠  東", "大  宇", "中  興", "南  僑", "台  達", "三商行", "北企銀", "裕  隆", 
                  "長  榮", "宏  碁"],
    }
  };

  /**
   Elements
   1: Court
   2: Stock
   3: Chance
   4: News
   5: Tax
   6: Casino
   7: Park
   8: CommunityChest
   9: Carnival
   10: Hospital
   11: Jail
   12: Bank
   13: Market
   14: Road
   15: Road with land
   16: Passing Bank
   17: Monthly Report
  */
  var defaultEntered = false;
  function ani_default() {
    var mvg = Players.isMoving;
    if (mvg) {
      Players.move();
    }
    // Draw seen map: 9x9 blocks
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    // Draw players
    drawPlayer();
    // Draw sidebar
    drawSidebar();
    // If the animation is playing, then disable keyboard intrupt
    if (mvg) {
      drawDice(Players.dice1 - 1, Players.dice2 - 1);
      return;
    }
    if (currentPlayer.robot) {
      Players.dice();
      return;
    }
    cko_default();
    // Draw cursor
    drawCursor();
    if (!defaultEntered) {
      drawDice(dice(), dice());
    }
  }
  
  function cko_default() {
    var obj = null;
    var objList = OverObjects[0];
    for (var i=0; i<objList.length; ++i) {
      if (isPtInside(objList[i].x, objList[i].y, 
          objList[i].width, objList[i].height, 
          cursorPos.x, cursorPos.y)) {
        obj = objList[i];
        break;
      }
    }
    if (obj) {
      obj.drawSelected();
      return obj.action;
    }
  }
  
  function kp_default(e) {
    // If the animation is playing, then disable keyboard intrupt
    if (Players.isMoving) return;
    if (currentPlayer.robot) return;
    var kc = e.keyCode;
    switch (kc) {
    case 37: // left
      cursorPos.x -= CursorMovement;
      if (cursorPos.x < 0) cursorPos.x = 0;
      break;
    case 38: // up
      cursorPos.y -= CursorMovement;
      if (cursorPos.y < 0) cursorPos.y = 0;
      break;
    case 39: // right
      cursorPos.x += CursorMovement;
      if (cursorPos.x >= CanvasWidth) cursorPos.x = CanvasWidth - 1;
      break;
    case 40: // down
      cursorPos.y += CursorMovement;
      if (cursorPos.y >= CanvasHeight) cursorPos.y = CanvasHeight - 1;
      break;
    case 32: // space
    case 13: // enter
      defaultEntered = true;
      break;
    }
    var action = cko_default();
    if (defaultEntered) {
      if (action) {
        action();
      } else {
        console.log("no enterAction defined");
      }
    }
  }
  
  function ani_court() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("法  院", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("法  院", 320, 140);
    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  var obj_court = new Array();
  
  function kp_court(e) {
  }
  
  var stockDelay = 0;
  var stockPage = 1;
  var stockStatus = 0; // 0: menu, 1: buyselect, 2: sellselect, 3: query, 4: leave, 5: buyabacus, 6: sellabacus
  var stockMenuIntent = 0; // 0: next page, 1: buy, 2: sell, 3: query, 4: leave;
  var stockItemIntent = 0;
  var stockVolume;
  var stockMax;
  var stockChange;
  var StockMenu = ["下一頁", "買  進", "賣  出", "查  詢", "離  開"];
  var stockSelected;
  function drawStock() {
    context.drawImage(StockImg, 0, 0, 320, 240, 0, 0, 640, 480);
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";
    context.fillText(currentPlayer.name, 350, 64);    
    context.fillStyle = "blue";
    context.fillText(currentPlayer.name, 348, 62);    

    // Draw data
    context.font = "25px sans-serif";
    context.fillStyle = "black";
    context.fillText(currentPlayer.cash, 350, 129);
    context.fillText(currentPlayer.deposit, 350, 191);
    context.fillText(currentPlayer.stocktot, 124, 191);
    context.fillStyle = "yellow";
    context.fillText(currentPlayer.cash, 348, 127);
    context.fillText(currentPlayer.deposit, 348, 189);
    context.fillText(currentPlayer.stocktot, 122, 189);
    
    // Column Names
    context.font = "33px sans-serif";
    context.fillStyle = "blue";
    context.fillText(stockPage, 82, 257);
    
    for (var s=0; s<5; ++s) {
      var id = (stockPage - 1) * 5 + s;
      var y = 305 + 42 * s;
      context.fillStyle = "pink";
      context.fillText(stockList[id].name, 16, y); 
      context.fillStyle = "orange";
      context.fillText(stockList[id].price, 163, y);
      var stock = currentPlayer.stock[id];
      if (stock.volume > 0) {
        context.fillText(stock.price, 355, y);
        context.fillText(stock.volume, 542, y);
      } else {
        context.fillStyle = "green";
        context.fillText("------", 369, y);
        context.fillText("------", 561, y);
      }
    }
    
    if (currentPlayer.robot) return;
    // Menu
    context.font = "33px sans-serif";
    context.fillStyle = "blue";
    for (var id=0, l=StockMenu.length; id<l; ++id) {
      context.fillText(StockMenu[id], 518, 38 + 44 * id);
    }
    
    context.fillStyle = "yellow";
    context.fillText(StockMenu[stockMenuIntent], 518, 38 + 44 * stockMenuIntent);
    
    if (stockStatus == 1 || stockStatus == 2) {
      context.beginPath();
      context.rect(0, 268 + stockItemIntent * 42, 305, 42);
      context.fillStyle = "rgba(143, 29, 23, 0.6)";
      context.fill();
    } else if (stockStatus == 5 || stockStatus == 6) {
      context.beginPath();
      context.rect(189, 143, 317, 118);
      context.fillStyle = "rgb(107, 22, 17)";
      context.fill();
      context.strokeStyle = 'rgb(54, 11, 9)';
      context.stroke();
      context.drawImage(AbacusImg, 189, 265);
      context.drawImage(AbacusImg, 246, 0, 20, 50, cursorPos.x - 10, cursorPos.y - 25, 20, 50);
      var msg = "買  進";
      if (stockMenuIntent == 2) {
        msg = "賣  出";
      }
      context.fillStyle = "blue";
      context.fillText(msg, 223, 246);
      context.fillStyle = "white";
      context.fillText(stockList[stockSelected].name, 205, 193);
      context.fillStyle = "yellow";
      context.fillText("( 0 - " + stockMax + ")", 305, 193);
      context.fillText(stockVolume, 340, 251);
    }
  }
  
  var stockFirstHalf = 0;
  function drawStockBoard() {
    context.beginPath();
    context.rect(0, 0, 640, 480);
    context.fillStyle = 'black';
    context.fill();
    if (stockFirstHalf == 0) {
      context.font = "33px sans-serif";
      context.fillStyle = "blue";
      context.fillText("成交價", 160, 57);
      context.fillText("成交量", 288, 57);
      context.fillText("漲幅%", 528, 57);
      
      context.fillStyle = "red";
      context.fillText("漲", 432, 57);
      context.fillStyle = "green";
      context.fillText("跌", 464, 57);
    }
    context.font = "25px sans-serif";
    for (var i=0; i<10; ++i) {
      var stock = stockList[i + stockFirstHalf * 10];
      context.fillStyle = "white";
      context.fillText(stock.name, 18, 105 + 40 * i - stockFirstHalf * 65);
      context.fillText(stock.volume, 288, 105 + 40 * i - stockFirstHalf * 65);
      var per = parseFloat(stock.percent) * 100;
      context.fillText(per.toFixed(2), 528, 105 + 40 * i - stockFirstHalf * 65);
      context.fillStyle = "yellow";
      var pri = parseFloat(stock.price);
      context.fillText(pri.toFixed(2), 160, 105 + 40 * i - stockFirstHalf * 65);
      if (stock.change > 0) context.fillStyle = "red";
      else context.fillStyle = "green";
      var chg = parseFloat(stock.change);
      context.fillText(chg.toFixed(2), 414, 105 + 40 * i - stockFirstHalf * 65);
    }
  }
  
  function ani_stock() {
    if (stockDelay < 50) {
      ++stockDelay;
      drawMap(currentPlayer.position.x, currentPlayer.position.y);
      drawPlayer();
      drawSidebar();
      context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
      context.font = "43px sans-serif";
      context.fillStyle = "black";
      context.fillText("股  市", 322, 142);
      context.fillStyle = "yellow";
      context.fillText("股  市", 320, 140);
      if (stockDelay == 49) {
        stockMenuIntent = 0;
        stockStatus = 0;
        stockPage = 1;
        stockChange = 0;
      }
    } else if (stockDelay == 50) {
      if (currentPlayer.robot) { // TODO: need AI
        stockDelay = 51;
        return;
      }
      switch (stockStatus) {
        case 0: // Menu 
        case 1: case 2: // Buy/sell select
        case 6: case 5: // buy/sell abacus
        drawStock();
        drawCursor();
        break;
        case 3: // query
        drawStockBoard();
        break;
        case 4: // leave
        drawStock();
        stockDelay = 51;
        break;
      }
    } else if (stockDelay < 100) {
      drawMap(currentPlayer.position.x, currentPlayer.position.y);
      drawPlayer();
      drawSidebar();
      if (stockChange == 0) {
        context.drawImage(BubbleImg, 0, 0, 90, 45, 327, 123, 180, 90);
        context.font = "35px sans-serif";
        context.fillStyle = "black";
        context.fillText("時機不對", 350, 180);
        context.fillStyle = "red";
        context.fillText("時機不對", 352, 178);
      }
      ++stockDelay;
      if (stockDelay == 99) {
        stockDelay = 0;
        turnToNextPlayer();
      }
    }
  }
  
  function kp_stock(e) {
    // If the animation is playing, then disable keyboard intrupt
    if (currentPlayer.robot) return;
    var kc = e.keyCode;
    var entered = false;
    switch (kc) {
    case 27: // ESC
      stockStatus = 0;
      stockMenuIntent = 0;
      cursorPos.x = CursorPositions[2].x;
      cursorPos.y = CursorPositions[2].y;
      break;
    case 37: // left
      if (stockStatus == 6 || stockStatus == 5) {
        --cursorPos.x;
        if (cursorPos.x < 209) {
          cursorPos.x = 209;
        }
      }
      break;
    case 38: // up
      if (stockStatus == 0) {
        cursorPos.y -= 44;
        if (cursorPos.y < 26) cursorPos.y = 26;
      } else if (stockStatus == 1 || stockStatus == 2) {
        cursorPos.y -= 42;
        if (cursorPos.y < 286) cursorPos.y = 286;
      }
      break;
    case 39: // right
      if (stockStatus == 6 || stockStatus == 5) {
        ++cursorPos.x;
        if (cursorPos.x > 409) {
          cursorPos.x = 409;
        }
      }
      break;
    case 40: // down
      if (stockStatus == 0) {
        cursorPos.y += 44;
        if (cursorPos.y > 202) {
          cursorPos.y = 202;
        }
      } else if (stockStatus == 1 || stockStatus == 2) {
        cursorPos.y += 42;
        if (cursorPos.y > 454) cursorPos.y = 454;
      }
      break;
    case 32: // space
    case 13: // enter
      entered = true;
      break;
    }
    cko_stock();
    if (entered) {
      switch (stockStatus) {
        case 0:
        switch (stockMenuIntent) {
          case 0: // Next page
          ++stockPage;
          if (stockPage > 4) stockPage = 1;
          break;
          case 1: case 2: case 3: case 4:
          stockItemIntent = 0;
          stockStatus = stockMenuIntent;
          cursorPos.y = 286;
          cursorPos.x = 160;
          break;
        }
        break;
        case 1: case 2: // Bug/sell select
        stockSelected = (stockPage - 1) * 5 + stockItemIntent;
        stockVolume = 0;
        if (stockStatus == 1) { // buy
          stockMax = Math.floor(currentPlayer.cash / stockList[stockSelected].price);
        } else { // sell, if the player does not buy this one, then goes back to main menu
          var s = currentPlayer.stock[stockSelected];
          if (s != null && s.volume > 0) {
            stockMax = s.volume;
          } else {
            stockStatus = 0;
            stockMenuIntent = 0;
            cursorPos.x = CursorPositions[2].x;
            cursorPos.y = CursorPositions[2].y;
            return;
          }
        }
        if (stockMax > 50000) stockMax = 50000;
        cursorPos.x = 209;
        cursorPos.y = 290;
        stockStatus = stockMenuIntent + 4;
        break;
        case 3: // query
        if (stockFirstHalf == 0) {
          stockFirstHalf = 1;
        } else {
          stockFirstHalf = 0;
          stockStatus = 0;
          cursorPos.x = CursorPositions[2].x;
          cursorPos.y = CursorPositions[2].y;
        }
        break;
        case 6: case 5: // buy/sell abacus
        var price = Math.floor(stockVolume * stockList[stockSelected].price);
        if (stockStatus == 6) { // sell
          currentPlayer.cash += price;
          currentPlayer.stocktot -= price;
          currentPlayer.stock[stockSelected].volume -= stockVolume;
          stockChange -= price;
          console.log("stock sell " + price);
        } else { // buy
          currentPlayer.cash -= price;
          stockChange -= price;
          currentPlayer.stocktot += price;
          currentPlayer.stock[stockSelected].volume += stockVolume;
          currentPlayer.stock[stockSelected].price = stockList[stockSelected].price;
          console.log("stock buy " + price);
        }
        stockStatus = 0;
        stockMenuIntent = 0;
        cursorPos.x = CursorPositions[2].x;
        cursorPos.y = CursorPositions[2].y;
        break;
      }
    }
  }
  
  function cko_stock() {
    switch (stockStatus) {
      case 0: // Menu
      stockMenuIntent = Math.floor((cursorPos.y - 26) / 44);
      console.log("stockMenuIntent " + stockMenuIntent + " stockStatus " + stockStatus);
      break;
      case 1: case 2: // buy/sell select
      stockItemIntent = Math.floor((cursorPos.y - 286) / 42);
      console.log("stockItemIntent " + stockItemIntent);
      break;
      case 6: case 5: // buy/sell abacus
      stockVolume = Math.floor((cursorPos.x - 209) / 200 * stockMax);
      console.log("stockVolume " + stockVolume);
      break;
    }
  }
  
  var chanceDelay = 0;
  var chanceImgX, chanceImgY;
  var chancePick;
  function ani_chance() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("運  氣", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("運  氣", 320, 140);

    if (chanceDelay < 150) {
      ++chanceDelay;
      if (chanceDelay == 50) {
        chancePick = Math.floor(Math.random() * NumOfChances);
        chanceImgX = Math.floor(chancePick % 4) * ChanceImgWidth;
        chanceImgY = Math.floor(chancePick / 4) * ChanceImgHeight;
      } else if (chanceDelay > 50) {
        context.drawImage(ChanceImg, chanceImgX, chanceImgY, ChanceImgWidth, ChanceImgHeight, 
          281, 186, ChanceDisplayWidth, ChanceDisplayHeight);
        if (chanceDelay == 100) {
          Chances[chancePick]();
        }
      }
    } else {
      chanceDelay = 0;
      turnToNextPlayer();
    }
  }

  var newsDelay = 0;
  function ani_news() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();

    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("新   聞", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("新   聞", 320, 140);

    if (newsDelay < 50) {
      ++newsDelay;
    } else {
      newsDelay = 0;
      turnToNextPlayer();
    }
  }

  var taxDelay = 0;
  var taxMount, taxTitle;
  function drawTax(price) {
    context.beginPath();
    context.rect(240, 220, 340, 130);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText(taxTitle, 283, 278);
    context.fillText("=   " + taxMount, 427, 319);

    context.fillStyle = "yellow";
    context.fillText(taxTitle, 281, 276);
    context.fillText("=   " + taxMount, 425, 317);
  }

  function ani_tax() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("稅捐處", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("稅捐處", 320, 140);
    
    if (taxDelay == 0) {
      if (Math.floor(Math.random() * 2) == 0) { // Cash tax
        taxMount = Math.floor(currentPlayer.cash * 0.1);
        taxTitle = "抽現金稅百分之十";
      } else { // property tax (real estate)
        taxMount = Math.floor(currentPlayer.realestate * 0.05);
        taxTitle = "交土地稅百分之五";
      }
      currentPlayer.cash -= taxMount;
      checkPlayerCashFlow(currentPlayer);
    }
    if (taxDelay < 100) {
      ++taxDelay;
      drawTax();
    } else {
      taxDelay = 0;
      turnToNextPlayer();
    }
  }

  var CasinoMatrix = [
    [4, 111, 222, 333, 444, 555, 666, 11],
    [5, 8,   's', 's', 'b', 'b', 15,  12],
    [6, 9,   's', 's', 'b', 'b', 16,  13],
    [7, 10,  's', 's', 'b', 'b', 17,  14]
  ];
  var CasinoRMatrix = {
    4: [0, 0], 111: [1, 0], 222: [2, 0], 333: [3, 0], 444: [4, 0], 555: [5, 0], 666: [6, 0], 11: [7, 0],
    5: [0, 1], 8: [1, 1],                                                       15: [6, 1], 12: [7, 1], 
    6: [0, 2], 9: [1, 2],    /* SMALL */                   /* BIG */            16: [6, 2], 13: [7, 2],
    7: [0, 3], 10: [1, 3],                                                      17: [6, 3], 14: [7, 3]
  };
  
  var casinoDelay = 0;
  var casinoResult;
  var casinoStatus = 0; // 0: bet, 1: wait, 2: quit
  var numOfCoins = 1;
  var casinoOverSquare = 's';
  var coinsPos = [];
  var casinoDice = [];
  function drawCoins() {
    if (casinoStatus == 1) {
      for (var i=0; i<coinsPos.length; ++i) {
        context.drawImage(CoinImg, 0, 0, 31, 34, coinsPos[i].x, coinsPos[i].y, 62, 68);
      }
    } else if (casinoStatus == 0) {
      context.drawImage(CoinImg, 0, 0, 31, 31, cursorPos.x - 31, cursorPos.y - 34, 62, 68);
    }
  }
  
  function drawCasinoDice(d1, d2, d3) {
    context.drawImage(DiceImg, 54 * d1, 0, 54, 72, 124, 10, 54, 72);
    context.drawImage(DiceImg, 54 * d2, 0, 54, 72, 56, 10, 54, 72);
    context.drawImage(DiceImg, 54 * d3, 0, 54, 72, 80, 46, 54, 72);
  }
  
  function drawCasinoBet() {
    var width = 80;
    var height = 84;
    var ix, iy
    if (casinoOverSquare == 's') {  // Intent
      width = 160;
      height = 252;
      ix = 160;
      iy = 228;
    } else if (casinoOverSquare == 'b') {
      width = 160;
      height = 252;
      ix = 320;
      iy = 228;
    } else {
      ix = CasinoRMatrix[casinoOverSquare][0] * 80;
      iy = CasinoRMatrix[casinoOverSquare][1] * 84 + 144;
    }
    context.beginPath();
    context.rect(ix, iy, width, height);
    context.fillStyle = "rgba(27, 192, 242, 0.6)";
    context.fill();
    drawCoins();
    drawCasinoDice(dice() + 1, dice() + 1, dice() + 1);
    drawCursor();
  }
    
  function drawCasinoResult() {
      // Draw hit blocks
      var sx = 160;
      var sy = 228;
      if (casinoResult > 10) { // Big
        sx = 320;
        sy = 228;
      }
      // Small/Big
      context.beginPath();
      context.rect(sx, sy, 160, 249);
      context.fillStyle = "rgba(242, 48, 27, 0.6)";
      context.fill();
      // Exact
      context.beginPath();
      context.rect(CasinoRMatrix[casinoResult][0] * 80, CasinoRMatrix[casinoResult][1] * 84 + 144, 80, 84);
      context.fillStyle = "rgba(242, 48, 27, 0.6)";
      context.fill();
      drawCasinoDice(casinoDice[0] - 1, casinoDice[1] - 1, casinoDice[2] - 1);
      drawCoins();
      drawCursor();
  }
    
  function drawCasinoDialog() {
    context.font = "35px sans-serif";
    context.fillStyle = "orange";
    context.fillText(numOfCoins * 1000, 200, 342);
    context.fillStyle = "yellow";
    context.fillText("贏了還要再繼續嗎", 200, 446);
    context.font = "25px sans-serif";
    if (cursorPos.y == 425) {
      context.fillStyle = "red";
      context.fillText("Yes", 478, 428);
      context.fillStyle = "gray";
      context.fillText("No", 478, 458);
    } else {
      context.fillStyle = "red";
      context.fillText("No", 478, 458);
      context.fillStyle = "gray";
      context.fillText("Yes", 478, 428);
    }
  }
  
  function drawCasinoBanner() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("賭  場", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("賭  場", 320, 140);
    if (casinoDelay == 49) {
      currentPlayer.cash -= 1000;
      casinoStatus = 0; // bet
      casinoDice = [0, 1, 2];
      casinoResult = null;
      numOfCoins = 1;
      casinoOverSquare = 's';
    }
  }
  
  function drawCasinoRolling() {
    drawCasinoResult();
    if (currentPlayer.robot) {
      if (casinoDelay < 250) {
        ++casinoDelay;
        if (casinoDelay == 210) {
          if (Math.floor(Math.random() * 2) == 0) {
            cursorPos.y = 425;
          } else {
            cursorPos.y = 455;
          }
        }
        if (casinoDelay == 249) {
          casinoJudge();
          if (casinoStatus == 0) {
            casinoDelay = 50;
          }
        }
      }
    } else {
      drawCasinoDialog();
    }
  }
  
  function ani_casino() {
    if (currentPlayer.cash < 1000) {
      if (casinoDelay < 100) {
        ++casinoDelay;
        drawMap(currentPlayer.position.x, currentPlayer.position.y);
        drawPlayer();
        drawSidebar();
        context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
        context.font = "43px sans-serif";
        context.fillStyle = "black";
        context.fillText("賭  場", 322, 142);
        context.fillStyle = "yellow";
        context.fillText("賭  場", 320, 140);
        if (casinoDelay > 50) {
          context.drawImage(BubbleImg, 0, 0, 90, 45, 327, 123, 180, 90);
          context.font = "35px sans-serif";
          context.fillStyle = "black";
          context.fillText("沒帶錢呀", 350, 180);
          context.fillStyle = "red";
          context.fillText("沒帶錢呀", 352, 178);
          if (casinoDelay == 99) {
            casinoDelay = 0;
            turnToNextPlayer();
          }
        }
      }
    }
    else if (casinoDelay < 50) {
      ++casinoDelay;
      drawCasinoBanner();
    } else if (casinoDelay < 550) {
      context.drawImage(CasinoImg, 0, 0, 320, 240, 0, 0, CanvasWidth, CanvasHeight); // Background
      switch (casinoStatus) {
      case 0:
        if (currentPlayer.robot) {
          if (casinoDelay < 150) { // wait for two seconds
            ++casinoDelay;
            if (casinoDelay == 55) {
              if (Math.floor(Math.random() * 2) == 0) {
                cursorPos.x = 200;
                cursorPos.y = 354;
              } else {
                cursorPos.x = 356;
                cursorPos.y = 354;
              }
              cko_casino();
            }
          }
          if (casinoDelay == 149) {
            console.log("robot bet " + casinoOverSquare);
            casinoJudge();
            if (casinoStatus == 1) {
              casinoDelay = 200;
              console.log("robot wins");
            } else {
              console.log("robot loses");
            }
          }
        }
        drawCasinoBet();
        break;
      case 1:
        drawCasinoRolling();
        break;
      case 2:
        drawCasinoResult();
        if (casinoDelay < 550) {
          ++casinoDelay;
        }
      }
    } else if (casinoDelay < 600) {
      ++casinoDelay;
      var txt = "見好就收";
      if (numOfCoins == 0) { // 真是可惜
        txt = "真是可惜";
      } else if (numOfCoins > 4) { // 大捞一票
        txt = "大撈一票";
      }
      drawMap(currentPlayer.position.x, currentPlayer.position.y);
      drawPlayer();
      drawSidebar();

      context.drawImage(BubbleImg, 0, 0, 90, 45, 327, 123, 180, 90);
      context.font = "35px sans-serif";
      context.fillStyle = "black";
      context.fillText(txt, 350, 180);
      context.fillStyle = "red";
      context.fillText(txt, 352, 178);
    } else {
      drawMap(currentPlayer.position.x, currentPlayer.position.y);
      drawPlayer();
      drawSidebar();
      casinoDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function kp_casino(e) {
    if (currentPlayer.robot) return;
    var kc = e.keyCode;
    var entered = false;
    switch (kc) {
    case 37: // left
      if (casinoStatus == 0) { // bet
        if (cursorPos.x - 80 > 0) {
          cursorPos.x -= 80;
        }
      }
      break;
    case 38: // up
      if (casinoStatus == 0) { // bet
        if (cursorPos.y - 84 > 144) {
          cursorPos.y -= 84;
        }
      } else if (casinoStatus == 1) {
        cursorPos.y = 425;
      }
      break;
    case 39: // right
      if (casinoStatus == 0) {
        if (cursorPos.x + 80 < 640) {
          cursorPos.x += 80;
        }
      }
      break;
    case 40: // down
      if (casinoStatus == 0) {
        if (cursorPos.y + 84 < 480) {
          cursorPos.y += 84;
        }
      } else if (casinoStatus == 1) {
        cursorPos.y = 455;
      }
      break;
    case 32: // space
    case 13: // enter
      entered = true;
      break;
    } // switch
    cko_casino();
    if (entered) {
      casinoJudge();
    }
    console.log("casinoStatus " + casinoStatus);
  }
  
  function casinoJudge() {
    if (casinoStatus == 0) {
      for (var i=0; i<3; ++i) {
        casinoDice[i] = dice() + 1;
      }
      if (casinoDice[0] == casinoDice[1] && casinoDice[1] == casinoDice[2]) { // x 100
        casinoResult = casinoDice[0] * 100 + casinoDice[1] * 10 + casinoDice[2];
      } else { // Others
        casinoResult = casinoDice[0] + casinoDice[1] + casinoDice[2];
      }
      console.log("casinoResult " + casinoResult + " dice1 " + casinoDice[0] + " dice2 " + casinoDice[1] + " dice3 " + casinoDice[2]);
      if (casinoOverSquare == 's' && casinoResult < 11 
          || casinoOverSquare == 'b' && casinoResult > 10 && casinoResult < 19
          || casinoOverSquare == casinoResult) { // Bingo!
        if (casinoOverSquare == 's' || casinoOverSquare == 'b') {
          numOfCoins *= 2;
        } else if (casinoOverSquare > 100) {
          numOfCoins *= 100;
        } else {
          numOfCoins *= 10;
        }
        generateCoinsPositions();
        if (!currentPlayer.robot) {
          cursorPos.x = 480;
          cursorPos.y = 425;
        }
        casinoStatus = 1;
      } else {
        casinoStatus = 2;
        casinoDelay = 500;
        numOfCoins = 0;
      }
    } else if (casinoStatus == 1) {
      if (cursorPos.y == 425) {
        casinoStatus = 0;
      } else {
        currentPlayer.cash += numOfCoins * 1000;
        casinoStatus = 2;
        casinoDelay = 500;
      }
    }
  }
  
  function generateCoinsPositions() {
    var noc = numOfCoins-1 > 8 ? 8 : numOfCoins-1;
    coinsPos = [];
    while (noc--) {
      var dx = cursorPos.x - 31 + Math.floor(Math.random() * 20 * noc - 2 * noc);
      var dy = cursorPos.y - 34 + Math.floor(Math.random() * 20 * noc - 2 * noc);
      coinsPos.push({x:dx, y:dy});
    }
    coinsPos.push({x: cursorPos.x, y: cursorPos.y});
  }
  
  function cko_casino() {
    if (casinoStatus == 0) {
      var ix = Math.floor(cursorPos.x / 80);
      var iy = Math.floor((cursorPos.y - 144) / 84);
      casinoOverSquare = CasinoMatrix[iy][ix];
    }
  }

  var parkDelay = 0;
  function ani_park() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("公  園", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("公  園", 320, 140);

    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  
  var commuchestDelay = 0;
  var commuchestCard;
  
  function drawCard(name) {
    context.beginPath();
    context.rect(258, 193, 340, 87);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText("免費獲得", 302, 252);
    context.fillText(name, 446, 253);

    context.fillStyle = "yellow";
    context.fillText("免費獲得", 300, 250);
    context.fillText(name, 444, 251);
  }
  
  function ani_commuchest() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);

    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("卡  片", 322, 142);

    context.fillStyle = "yellow";
    context.fillText("卡  片", 320, 140);

    drawPlayer();
    drawSidebar();
    if (commuchestDelay < 100) {
      ++commuchestDelay;
      if (commuchestDelay == 30) {
        var pick = Math.floor(Math.random() * NumOfCards);
        commuchestCard = Cards[pick].name;
        currentPlayer.cards.push(pick);
      } else if (commuchestDelay > 30) {
        drawCard(commuchestCard);
      }
    } else {
      commuchestDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function ani_carnival() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);

    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("遊樂場", 322, 142);

    context.fillStyle = "yellow";
    context.fillText("遊樂場", 320, 140);

    drawPlayer();
    drawSidebar();
    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function kp_carnival(e) {
  }
  
  function ani_hospital() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);

    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("医   院", 322, 142);

    context.fillStyle = "yellow";
    context.fillText("医   院", 320, 140);

    drawPlayer();
    drawSidebar();
    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function ani_jail() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);

    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("监   狱", 322, 142);

    context.fillStyle = "yellow";
    context.fillText("监   狱", 320, 140);

    drawPlayer();
    drawSidebar();
    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }

  function ani_bank() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);

    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("銀  行", 322, 142);

    context.fillStyle = "yellow";
    context.fillText("銀  行", 320, 140);

    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function kp_bank(e) {
  }

  function ani_market() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    context.drawImage(LandLabelImg, 0, 0, 180, 130, 292, 86, 180, 75);
    drawPlayer();
    drawSidebar();
    context.font = "43px sans-serif";
    context.fillStyle = "black";
    context.fillText("黑   市", 322, 142);
    context.fillStyle = "yellow";
    context.fillText("黑   市", 320, 140);

    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }

  function kp_market(e) {
  }

  function ani_road() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    if (parkDelay < 50) {
      ++parkDelay;
    } else {
      parkDelay = 0;
      turnToNextPlayer();
    }
  }
  
  function drawUpgradePrice(param) {
    var n = param[0];
    var p = param[1];
    // Shadows
    context.fillStyle = "black";
    context.font = "35px sans-serif";
    context.fillText(n, 292, 122);

    context.font = "35px sans-serif";
    context.fillText("投入資本 ", 292, 171);
    context.font = "30px sans-serif";
    context.fillText(p, 436, 171);

    // Text
    context.font = "35px sans-serif";
    context.fillStyle = "blue";
    context.fillText(n, 290, 120);

    context.font = "35px sans-serif";
    context.fillText("投入資本 ", 290, 169);      
    context.font = "30px sans-serif";
    context.fillStyle = "yellow";
    context.fillText(p, 438, 169);

  }
  
  function drawYesNoDialog() {
    context.font = "25px sans-serif";
    if (passbyResult) {
      context.fillStyle = "orange";
    } else {    
      context.fillStyle = "black";
    }
    context.fillText("Yes", 474, 227);
    
    if (!passbyResult) {
      context.fillStyle = "orange";
    } else {    
      context.fillStyle = "black";
    }
    context.fillText("No", 474, 262);

  }
  
  function drawLandlordRental(param) {
    if (passbyDelay < 30) { // Blinking effect
      if (Math.floor(passbyDelay / 10) % 2) {
        return;
      }
      var list = param.list;
      for (var key in list) {
        var block = list[key];
        var x = SideBarWidth + block.mx - mapOffsetX;
        var y = MenuOptionHeight + block.my - mapOffsetY;
        context.beginPath();
        context.rect(x, y, GridLength, GridLength);
        context.fillStyle = "rgba(0, 0, 0, 0.3)";
        context.fill();
      }
      return;
    }
    
    var n = param.name;
    var p = param.price;
    context.beginPath();
    context.rect(274, 123, 308, 87);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText("本地屬於", 312, 162);
    context.fillText(n, 454, 162);
    context.fillText("付租金", 342, 201);
    context.fillText(p, 470, 203);

    context.fillStyle = "yellow";
    context.fillText("本地屬於", 310, 160);
    context.fillStyle = "blue";
    context.fillText(n, 452, 160);
    context.fillText("付租金", 340, 199);
    context.fillStyle = "orange";
    context.fillText(p, 468, 201);
  } 

  function drawPurchaseDialog() {
    context.fillStyle = "black";
    context.font = "35px sans-serif";  
    context.fillText("買下此地", 322, 249);
    context.fillStyle = "blue";
    context.fillText("買下此地", 320, 247);
    drawYesNoDialog();
  }
  
  function drawLandNamePrice(param) {
    var n = param[0];
    var p = param[1];
    context.drawImage(LandLabelImg, 312, 80);
    // Shadows
    context.fillStyle = "black";
    context.font = "35px sans-serif";
    context.fillText(n, 354, 132);
    context.fillText("地價", 334, 194);
    context.font = "30px sans-serif";
    context.fillText(p, 408, 188);

    // Text
    context.font = "35px sans-serif";
    context.fillStyle = "white";
    context.fillText(n, 352, 130);
    context.fillText("地價", 332, 192);

    context.font = "30px sans-serif";
    context.fillStyle = "red";
    context.fillText(p, 406, 186);      
  }

  function drawNotEnoughCash() {
    context.font = "35px sans-serif";
    context.fillStyle = "black";
    context.fillText("您的現金不足", 322, 147);
    context.fillStyle = "gold";
    context.fillText("您的現金不足", 320, 145);
  }
  
  function buyEmptyLand(block, price) {
    console.log(currentPlayer.name + " bought " + block.c);
    block.owner = currentPlayerIndex;
    if (block.bldg == null) {
      block.bldg = 0;
    }
    currentPlayer.cash -= price;
    currentPlayer.realestate += price;
    currentPlayer.blocks.push(block);
    if (block.bldg > 0) {
      ++currentPlayer.building;
    }
    soldLands[block.lx].push(block);
  }
  
  function upgradeBldg(block, price) {
    console.log(currentPlayer.name + " upgraded " + block.c);
    if (block.bldg == 0) {
      ++currentPlayer.building;
    }
    ++block.bldg;
    currentPlayer.cash -= price;
    currentPlayer.realestate += price;
    bldgLands[block.lx].push(block);
  }
  
  function payRent(rent, owner) {
    owner.deposit += rent;
    currentPlayer.cash -= rent;
    checkPlayerCashFlow(currentPlayer);
  }
    
  var passbyKeypressed = false;
  var passbyResult = true;
  var passbyDelay = 0;
  var passbyInDelay = false;
  var passbyPlayAni = null;
  var passbyPlayAniParam = null;
  function ani_passby() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    drawDice(Players.dice1 - 1, Players.dice2 - 1);
    if (passbyPlayAni) {
      passbyPlayAni(passbyPlayAniParam);
    }
    
    // Clean up
    if (passbyInDelay) {
      if (passbyDelay < 70) {
        ++passbyDelay;
      } else {
        passbyResult = true;
        passbyKeypressed = false;
        passbyPlayAni = null;
        passbyPlayAniParam = null;
        passbyInDelay = false;
        passbyDelay = 0;
        cursorPos.x = CursorPositions[0].x;
        cursorPos.y = CursorPositions[0].y;
        turnToNextPlayer();
      }
      return;
    }
    // No need to draw cursor if it's in delay
    drawCursor();

    var bid = currentPlayer.gamePos.bid;
    var block = mapInfo[bid];
    var bldg = block.bldg; // 0: occupied, 1: one house, 2: two houses, 3: grocery store, 
                           // 4: supermarket, 5: skyscraper
    var owner = block.owner;
    var city = cityList[block.c];
    var name = city.display;
    var cash = currentPlayer.cash;

    if (owner != null) { // The block was sold
      if (owner == currentPlayerIndex) {
        var bldg = block.bldg;
        var cost = city.upgrade;
        if (bldg == 5 || cost > cash) { // do nothing if not enough cash or the bldg is already skyscraper
          passbyPlayAni = null;
          passbyPlayAniParam = null;
          passbyInDelay = true;
          return;
        }
        passbyPlayAniParam = [BldgUpgradeMsg[bldg], cost];
        passbyPlayAni = drawUpgradePrice;
        
        if (currentPlayer.robot) {
        // Robots have a simple strategy: just buy every empty block if they have enough cash          
          upgradeBldg(block, cost);
          passbyInDelay = true;
          return;
        } else {
          drawYesNoDialog();
          if (passbyKeypressed) {
            if (passbyResult) {
              upgradeBldg(block, cost);
            }
            passbyPlayAni = null;
            passbyPlayAniParam = null;
            passbyInDelay = true;
          }
        }
      } else { // if (owner != currentPlayerIndex)
        var rent = 0;
        var player = playerList[owner];
        var ownerObj = Players[player];
        var ownername = ownerObj.name;
        var blocks = city.blocks;
        var blist = [];
        for (var key in blocks) {
          var blockid = blocks[key];
          var blk = mapInfo[blockid];
          if (blk.owner == owner) {
            rent += city.rent[blk.bldg];
            blist.push(blk);
          }
        }
        passbyPlayAniParam = {name: ownername, price: rent, list: blist};
        passbyPlayAni = drawLandlordRental;
        payRent(rent, ownerObj);
        passbyInDelay = true;
        console.log("total cost " + rent);
      }
    } else { // Empty block
      var price = city.price;
      if (cash < price) {
        passbyPlayAniParam = null;
        if (currentPlayer.robot) {
          passbyPlayAni = null;
        } else {
          passbyPlayAni = drawNotEnoughCash;
        }
        passbyInDelay = true;
        return;
      }
      passbyPlayAniParam = [name, price];
      passbyPlayAni = drawLandNamePrice;

      if (currentPlayer.robot) {
        // Robots have a simple strategy: just buy every empty block if they have enough cash
        buyEmptyLand(block, price);
        passbyInDelay = true;
        return;
      } else {
        drawPurchaseDialog();
        if (passbyKeypressed) {
          if (passbyResult) {
            buyEmptyLand(block, price);
          }
          passbyPlayAni = null;
          passbyPlayAniParam = null;
          passbyInDelay = true;
        }
      }
    }
  }

  function kp_passby(e) {
    // If the animation is playing, then disable keyboard intrupt
    var kc = e.keyCode;
    switch (kc) {
    case 38: // up
      cursorPos.y = 224;
      passbyResult = true;
      break;
    case 40: // down
      cursorPos.y = 256;
      passbyResult = false;
      break;
    case 32: // space
    case 13: // enter
      passbyKeypressed = true;
      break;
    }
  }
  
  var passbankPlayAni = null;
  var passbankPlayAniParam = 0;
  var passbankDialogLevel = 0;
  function drawBankDialog() {
    context.beginPath();
    context.rect(246, 122, 212, 86);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  

    context.beginPath();
    context.rect(460, 122, 84, 129);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  

    context.fillStyle = "black";
    context.font = "29px sans-serif";  
    context.fillText("路過銀行", 290, 182);
    context.fillText("存款", 474, 156);
    context.fillText("領款", 474, 201);
    context.fillText("放棄", 474, 244);

    context.fillStyle = "yellow";
    context.fillText("路過銀行", 288, 180);
    context.fillStyle = "blue";
    context.fillText("存款", 472, 154);
    context.fillText("領款", 472, 199);
    context.fillText("放棄", 472, 242);
    context.fillStyle = "yellow";
    if (level0Selection == 0) {
      context.fillText("存款", 472, 154);      
    } else if (level0Selection == 1) {
      context.fillText("領款", 472, 199);    
    } else {
      context.fillText("放棄", 472, 242);    
    }
  }
  var passbankDelay = 0;
  function drawRobotPassbank(param) {
    var choice = param[0];
    var transferMoney = param[1];
    
    context.beginPath();
    context.rect(223, 247, 340, 86);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText(ATMDialog[choice], 267, 307);
    context.fillStyle = "gold";
    context.fillText(ATMDialog[choice], 265, 305);
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText(transferMoney, 398, 308);
    context.fillStyle = "gold";
    context.fillText(transferMoney, 396, 306);

    if (passbankDelay < 50) {
      ++passbankDelay;
    } else {
      passbankDelay = 0;
      passbankPlayAni = null;
      Game.status = 0;
    }
  }
  
  function ani_passbank() {
    drawMap(currentPlayer.position.x, currentPlayer.position.y);
    drawPlayer();
    drawSidebar();
    drawDice(Players.dice1 - 1, Players.dice2 - 1);
    
    if (!currentPlayer.robot) {
      drawBankDialog();
    }
    if (passbankPlayAni) {
      passbankPlayAni(passbankPlayAniParam);
      return;
    }
    if (currentPlayer.robot) {
      // Right now robots have a simple strategy, try to make the ratio of cash:deposti = 2:3
      var c = currentPlayer.cash;
      var d = currentPlayer.deposit;
      if (c / d < 0.4) { // not enough cash
        var delta = Math.floor((c + d) / 5) * 2 - c;
        currentPlayer.cash += delta;
        currentPlayer.deposit -= delta;
        passbankPlayAni = drawRobotPassbank;
        passbankPlayAniParam = [1, delta];
      } else if (c / d > 1.5){
        var delta = Math.floor((c + d) / 5 * 3 - d);
        currentPlayer.cash -= delta;
        currentPlayer.deposit += delta;
        passbankPlayAni = drawRobotPassbank;
        passbankPlayAniParam = [0, delta];
      } else {
        Game.status = 0;
      }
      passedBank = true;
    } else {
      drawCursor();
    }
  }
  
  var ATMDialog = ["存入金额 ", "提出金额 "];
  var transferMoney = 0;
  var level0Selection = 0;
  function drawDepositWithdrawDialog(choice) {
    context.beginPath();
    context.rect(223, 247, 340, 86);
    context.fillStyle = '#030B80';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = 'gray';
    context.stroke();  
    
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText(ATMDialog[choice], 267, 307);
    context.fillStyle = "gold";
    context.fillText(ATMDialog[choice], 265, 305);
    
    context.drawImage(AbacusImg, 269, 324);
    context.drawImage(AbacusImg, 246, 0, 20, 50, cursorPos.x - 10, cursorPos.y - 25, 20, 50);
    
    var money;
    if (choice == 0) {
      money = currentPlayer.cash;
    } else {
      money = currentPlayer.deposit;
    }
    transferMoney = Math.floor((cursorPos.x - 289) / 200 * money);
    context.fillStyle = "black";
    context.font = "33px sans-serif";  
    context.fillText(transferMoney, 398, 308);
    context.fillStyle = "gold";
    context.fillText(transferMoney, 396, 306);
  }
  
  function kp_passbank(e) {
    var kc = e.keyCode;
    var entered = false;
    if (passbankDialogLevel == 0) {
      switch (kc) {
      case 38: // up
        cursorPos.y -= 45;
        if (cursorPos.y < 159) {
          cursorPos.y = 159;
        }
        break;
      case 40: // down
        cursorPos.y += 45;
        if (cursorPos.y > 249) {
          cursorPos.y = 249;
        }
        break;
      case 32: // space
      case 13: // enter
        entered = true;
      }
      level0Selection = cko_passbankLevel0();
      if (entered) {
        if (level0Selection < 2) {
          passbankPlayAniParam = level0Selection;
          passbankPlayAni = drawDepositWithdrawDialog;
          passbankDialogLevel = 1;
          cursorPos.x = 289;
          cursorPos.y = 349;
        } else {
          cursorPos.x = CursorPositions[0].x;
          cursorPos.y = CursorPositions[0].y;
          passbankPlayAni = null;
          level0Selection = 0;
          passbankDialogLevel = 0;
          passedBank = true;
          Game.status = 0;
          return;
        }        
      }
    } else {
      switch (kc) {
      case 37: // left
        --cursorPos.x;
        if (cursorPos.x < 289) {
          cursorPos.x = 289;
        }
        break;
      case 39: // right
        ++cursorPos.x;
        if (cursorPos.x > 489) {
          cursorPos.x = 489;
        }
        break;
      case 32: // space
      case 13: // enter
        cko_passbankLevel1();
        break;
      }
    }
  }
  
  function cko_passbankLevel0() {
    return Math.floor((cursorPos.y - 159) / 45);
  }
  
  function cko_passbankLevel1() {
    if (level0Selection == 0) {
      currentPlayer.cash -= transferMoney;
      currentPlayer.deposit += transferMoney;
    } else {
      currentPlayer.cash += transferMoney;
      currentPlayer.deposit -= transferMoney;
    }
    cursorPos.x = CursorPositions[0].x;
    cursorPos.y = CursorPositions[0].y;
    passbankPlayAni = null;
    level0Selection = 0;
    passedBank = true;
    passbankDialogLevel = 0;
    Game.status = 0;
  }
  
  var monthlyDelay = 0;
  var Greetings = ["您好！", "又到了每月結算的日子", "大富翁銀行依每人存款", "支付百分之十的利息"];
  var Summary = ["希望您還要再加油哦", "加油哦！不要再墊底哦！"];
  var monthlyArray;
  var monthlyRank;
  var monthlyWinner;
  function ani_monthly() {
    context.putImageData(monthlyScreenImg, 0, 0);
    context.drawImage(AnchorImg, 370, 0);
    ++monthlyDelay;
    context.fillStyle = "gold";
    context.font = "36px sans-serif";  
    if (monthlyDelay < 300) {
      var k = monthlyDelay / 75;
      for (var i=0; i<=k; ++i) {
        context.fillText(Greetings[i], 16, 130 + i * 50);
      }
    } else if (monthlyDelay < 450) {
      if (monthlyDelay == 300) {
        monthlyArray = [];
        for (var i=0; i<maxNumOfPlayers; ++i) {
          var p = Players[playerList[i]];
          if (p.alive) {
            var name = p.name;
            var reward = Math.floor(p.deposit * 0.1);
            p.deposit += reward;
            monthlyArray.push({name:name, reward:reward});
          }
        }        
      }
      for (var i=0; i<monthlyArray.length; ++i) {
        context.fillText(monthlyArray[i].name + "   " + monthlyArray[i].reward, 16, 268 + i * 55);
      }
    } else if (monthlyDelay < 600) {
      context.fillText(Summary[0], 16, 130);
    } else if (monthlyDelay < 750) {
      if (monthlyDelay == 600) {
        monthlyRank = [];
        for (var role in playerList) {
          var name = playerList[role];
          var player = Players[name];
          if (!player.alive) continue;
          var tot = player.cash + player.deposit + player.realestate + player.stocktot;
          monthlyRank.push({value: tot, player: player});
        }
        for (var i=0; i<monthlyRank.length; ++i) {          
          for (var j=i+1; j<monthlyRank.length; ++j) {
            if (monthlyRank[i].value < monthlyRank[j].value) {
              var tmp = monthlyRank[i];
              monthlyRank[i] = monthlyRank[j];
              monthlyRank[j] = tmp;
            }
          }
        }
        monthlyWinner = monthlyRank[0].player.id + 1;
      }
      context.drawImage(WinImg, 0, 0, 320, 240, 0, 0, CanvasWidth, CanvasHeight);
      for (var i=0; i<monthlyRank.length; ++i) {
        var player = monthlyRank[i].player;
        var height = Math.floor(monthlyRank[i].value / 1000); // Scale down
        context.beginPath();
        context.rect(112 + i * 120, 380 - height, 34, height);
        context.fillStyle = 'yellow';
        context.fill();
        context.drawImage(HeadImg, player.id * 168 + 126, 0, 42, 42, 112 + i * 120, 330 - height, 42, 42);
      }
    } else if (monthlyDelay < 900) {
      context.drawImage(WinImg, monthlyWinner * 320, 0, 320, 240, 0, 0, CanvasWidth, CanvasHeight);
    } else {
      monthlyDelay = 0;
      Game.status = 0;
    }
  }
  
  var AnimateCallbacks = [ani_default, ani_court, ani_stock, ani_chance, ani_news, ani_tax, 
        ani_casino, ani_park, ani_commuchest, ani_carnival, ani_hospital, ani_jail, ani_bank, 
        ani_market, ani_road, ani_passby, ani_passbank, ani_monthly];

  var Cards = [
    // 0: 魔王卡：整街夷为平地
    {
      price: 0,
      name: "魔王卡",
      act: function() {}
    },
    // 1: 怪兽卡：破坏整栋大厦
    {
      price: 0,
      name: "怪獸卡",
      act: function() {}
    },
    // 2: 拆屋卡：拆除一层房屋
    {
      price: 0,
      name: "拆屋卡",
      act: function() {}
    },
    // 3: 路障卡：设置路障阻挡所有人前进
    {
      price: 0,
      name: "路障卡",
      act: function() {}
    },
    // 4: 地雷卡：放地雷炸弹害人
    {
      price: 0,
      name: "地雷卡",
      act: function() {}
    },
    // 5: 仙女卡：阻止大灾难发生
    {
      price: 0,
      name: "仙女卡",
      act: function() {}
    },
    // 6: 除障卡：拆除路障或地雷
    {
      price: 0,
      name: "除障卡",
      act: function() {}
    },
    // 7: 陷害卡：使对手坐牢五天
    {
      price: 0,
      name: "陷害卡",
      act: function() {}
    },
    // 8: 查封令：查封对手得房地产五天
    {
      price: 0,
      name: "查封令",
      act: function() {}
    },
    // 9: 冻结令：冻结对手的资金五天
    {
      price: 0,
      name: "凍結令",
      act: function() {}
    },
    // 10: 复仇卡：被陷害时可反击对方
    {
      price: 0,
      name: "復仇卡",
      act: function() {}
    },
    // 11: 嫁祸卡：被陷害时可转嫁给别人
    {
      price: 0,
      name: "嫁禍卡",
      act: function() {}
    },
    // 12: 免费卡：抵消2000元以上租金
    {
      price: 0,
      name: "免費卡",
      act: function() {}
    },
    // 13: 免狱令：抵消牢狱之灾一次
    {
      price: 0,
      name: "免獄令",
      act: function() {}
    },
    // 14: 免罪卡：抵消查封或冻结之灾
    {
      price: 0,
      name: "免罪卡",
      act: function() {}
    },
    // 15: 免税卡：免缴税金一次
    {
      price: 0,
      name: "免稅卡",
      act: function() {}
    },
    // 16: 均富卡：所有人现金重新平分
    {
      price: 0,
      name: "均富卡",
      act: function() {}
    },
    // 17: 购地卡：强制收购别人的土地
     {
      price: 0,
      name: "購地卡",
      act: function() {}
    },
    // 18: 售地卡：拍卖自己的土地一处
     {
      price: 0,
      name: "售地卡",
      act: function() {}
    },
    // 19: 换地卡：以自己的地换别人的地
     {
      price: 0,
      name: "換地卡",
      act: function() {}
    },
    // 20: 预约卡：预约一块空地
     {
      price: 0,
      name: "預約卡",
      act: function() {}
    },
    // 21: 冬眠符：使全部的对手睡眠五天
     {
      price: 0,
      name: "冬眠符",
      act: function() {}
    },
    // 22: 催眠符：使对手睡眠五天
     {
      price: 0,
      name: "催眠符",
      act: function() {}
    },
    // 23: 送神符：送走俯身的神明
     {
      price: 0,
      name: "送神符",
      act: function() {}
    },
    // 24: 请神符：请来最靠近的神明附身
     {
      price: 0,
      name: "請神符",
      act: function() {}
    },
    // 25: 金卡：持有的股票免费增加50％
     {
      price: 0,
      name: "金卡",
      act: function() {}
    },
    // 26: 银卡：持有股票免费增加30％
     {
      price: 0,
      name: "银卡",
      act: function() {}
    },
    // 27: 红卡：使股市全免大涨长红
     {
      price: 0,
      name: "红卡",
      act: function() {}
    },
    // 28: 黑卡：使股市全免大跌长黑
     {
      price: 0,
      name: "黑卡",
      act: function() {}
    },
    // 29: 抢夺卡：夺取一张卡片或1000元
     {
      price: 0,
      name: "搶奪卡",
      act: function() {}
    },
    // 30: 赌神牌：赌技必胜的宝物
     {
      price: 0,
      name: "賭神牌",
      act: function() {}
    },
    // 31: 赌圣牌：赌场中有预知能力
     {
      price: 0,
      name: "賭聖牌",
      act: function() {}
    },
    // 32: 友谊卡：降低对手的敌意
     {
      price: 0,
      name: "友誼卡",
      act: function() {}
    },
    // 33: 停留卡：使对手前进步数为零
     {
      price: 0,
      name: "停留卡",
      act: function() {}
    },
    // 34: 保险卡：遭遇损失时领补偿金
     {
      price: 0,
      name: "保險卡",
      act: function() {}
    },
    // 35: 疑问卡：不一定发生什么事情
     {
      price: 0,
      name: "疑問卡",
      act: function() {}
    },
  ];

  var Chances = [
    // 0: 内线交易获利30%
    function() {
      currentPlayer.cash = Math.floor(currentPlayer.cash * 1.3);
    },
    // 1: 举报走私得奖金二千元
    function() {
      currentPlayer.cash += 2000;
    },
    // 2: 现金被强盗抢走一半
    function() {
      currentPlayer.cash = Math.floor(currentPlayer.cash * 0.5);
    },
    // 3: 发票中奖得600元
    function() {
      currentPlayer.cash += 600;
    },
    // 4: 打工赚得一千元
    function() {
      currentPlayer.cash += 1000;
    },
    // 5: 路边拣到500元
    function() {
      currentPlayer.cash += 500;
    },
    // 6: 摆地摊赚得二千元
    function() {
      currentPlayer.cash += 2000;
    },
    // 7: 放高利贷获利40％
    function() {
      currentPlayer.cash = Math.floor(currentPlayer.cash * 1.4);
    },
    // 8: 现金被歹徒骗了20%
    function() {
      currentPlayer.cash = Math.floor(currentPlayer.cash * 0.8);
    },
    // 9: 现金投资获利20％
    function() {
      currentPlayer.cash = Math.floor(currentPlayer.cash * 1.2);
    },
    // 10: 交通违规罚三千元
    function() {
      currentPlayer.cash -= 3000;
      checkPlayerCashFlow(currentPlayer);
    },
    // 11: 制造噪音罚款600元
    function() {
      currentPlayer.cash -= 600;
      checkPlayerCashFlow(currentPlayer);
    },
    // 12: 打破玻璃赔一千元
    function() {
      currentPlayer.cash -= 1000;
      checkPlayerCashFlow(currentPlayer);
    },
    // 13: 向所有人收一千元红包
    function() {
      var money = 0;
      for (var key in playerList) {
        var name = playerList[key];
        if (Players[name].alive) {
          Players[name].cash -= 1000;
          money += 1000;
          checkPlayerCashFlow(Players[name]);
        }
      }
      currentPlayer.cash += money;
    },
    // 14: 漏税罚款二千元
    function() {
      currentPlayer.cash -= 2000;
      checkPlayerCashFlow(currentPlayer);
    },
    // 15: 赞助爱心捐款500元
    function() {
      currentPlayer.cash -= 500;
      checkPlayerCashFlow(currentPlayer);
    },
    // 16: 送每人一千元吃红
    function() {
      var money = 0;
      for (var key in playerList) {
        var name = playerList[key];
        if (Players[name].alive) {
          Players[name].cash += 1000;
          money += 1000;
        }
      }
      currentPlayer.cash -= money;
      checkPlayerCashFlow(currentPlayer);
    },
    // 17: 遗失500元
    function() {
      currentPlayer.cash -= 500;
      checkPlayerCashFlow(currentPlayer);
    },
    // 18: 妨碍风化坐牢七天
    function() {
      
    },
    // 跌入水沟住院三天
    function() {
      
    },
    // 
    function() {
      
    },
    //
    function() {
      
    },
    //
    function() {
      
    }
  ];

  /**
   * buddha
   * 0: none
   * 1: Wealth attached
   * 2: Mascot attached
   * 3: Poverty attached
   * 4: Badluck attached
   * Status
   * 0: active/good
   * 1: in hospital
   * 2: in jail
   * 3: hibernant
   * 4: frozen
   * 5: sealed
   * 6: asleep
   * 7: stay
   */
  var deltaX, deltaY, targetX, targetY, tgtBlock = null, tgtBid = null;
  var Players = {
    atuzai: {
      alive: true,
      id: 0, // unique id
      name: "阿 土 仔",
      cash: 25000,
      deposit: 25000,
    },
    dalaoqian: {
      alive: true,
      id: 1, // unique id
      name: "大 老 千",
      cash: 30000,
      deposit: 30000,
    },
    sunxiaomei: {
      alive: true,
      id: 2, // unique id
      name: "孫 小 美",
      cash: 25000,
      deposit: 25000,
    },
    qianfuren: {
      alive: true,
      id: 3, // unique id
      name: "錢 夫 人",
      cash: 27500,
      deposit: 27500,
    },
    path: [],
    isMoving: false, // use this boolean to block keyboard interupts
    dice1: 0,
    dice2: 0,
    dice: function() {
      this.dice1 = dice() + 1;
      this.dice2 = dice() + 1;
      var steps = this.dice1 + this.dice2;
      console.log(steps);
      var bid = currentPlayer.gamePos.bid, dir = currentPlayer.gamePos.d, block, nextlist, rev, set;
      do {
        block = mapInfo[bid];
        nextlist = block.n;
        rev = 3 - dir;
        set = [];
        for (var key in nextlist) {
          if (key == rev) continue;
          set.push(key);
        }
        dir = set[Math.floor(Math.random() * set.length)];
        bid = nextlist[dir];
        this.path.push([bid,dir]);
        steps -= mapInfo[bid].s;
      } while (steps);
      this.isMoving = true;
      console.log(this.path);
    },
 
    move: function() {
      // TODO: if player's status is asleep or hibernant or fronze, then return
      var position = currentPlayer.position;
      var posx = position.x;
      var posy = position.y;
      var gamepos = currentPlayer.gamePos;
      if (tgtBlock == null // haven't moved yet
          || posx == targetX && posy == targetY) { // Or reached one block
        if (posx == targetX) {
          gamepos.bid = tgtBid;
          this.path.shift();
          if (tgtBlock && tgtBlock.t == 12 && tgtBlock.s) {
            if (!passedBank) { // If passing bank
              cursorPos.x = CursorPositions[16].x;
              cursorPos.y = CursorPositions[16].y;
              Game.status = 16;
              return;
            } else {
              passedBank = false;
            }
          }
        }
        // Already got the destination
        if (this.path.length == 0) {
          this.isMoving = false;
          var t = tgtBlock.t; // tgtBlock shouldnt be null
          tgtBlock = null;
          tgtBid = null;
          // set cursor position according to what game status is activated
          cursorPos.x = CursorPositions[t].x;
          cursorPos.y = CursorPositions[t].y;
          Game.status = t;
          targetX = null;
          targetY = null;
          deltaX = null;
          deltaY = null; 
          return;
        }
        tgtBid = this.path[0][0];
        var dir = this.path[0][1];
        gamepos.d = dir;
        // check the next block and update dir
        tgtBlock = mapInfo[tgtBid]; // next block
        targetX = tgtBlock.x * GridLength;
        targetY = tgtBlock.y * GridLength;
        deltaX = (targetX - posx) > 0 ? 1 : ((targetX == posx) ? 0 : -1);
        deltaY = (targetY - posy) > 0 ? 1 : ((targetY == posy) ? 0 : -1);
        console.log("bd " + currentPlayer.buddha + " tgtBid " + tgtBid + " tgtX " + targetX + " tgtY " + targetY + " dx " + deltaX + " dy " + deltaY + " posx " + posx + " posy " + posy);
      }
      posx += deltaX * SpeedDelta;
      posy += deltaY * SpeedDelta;
      position.x = posx;
      position.y = posy;
      var bd = currentPlayer.buddha;
      if (bd >= 0) {
        buddhaPositions[bd].x = position.x + 20;
        buddhaPositions[bd].y = position.y - 20;
      }
    },
  }

  var keyPressedCallbacks = [kp_default,kp_court, kp_stock, null, null, null, kp_casino, 
      null, null, kp_carnival, null, null, kp_bank, kp_market, null, kp_passby, kp_passbank];
  
  var GameDate = {
    Months: [null,31,28,31,30,31,30,31,31,30,31,30,31],
    Prime: [null,31,29,31,30,31,30,31,31,30,31,30,31]
  }
  
  var Game = {
    status: 0,
    debug: true,
    Months: GameDate.Months,
    year: 1993,
    month: 1,
    day: 1,
    AnimateLoop: null,
    load: function() {
      // Initailize level and first player
      var cl = "taiwan"; // Only single player for now
      currentLevel = Levels[cl];
      mapSize = currentLevel.mapSize;
      mapInfo = currentLevel.mapInfo;
      mapImg = currentLevel.mapImg;
      playerList = currentLevel.playerList;
      // Initialize players' positions/directions in Game and Map coordinations
      for (var i=0; i<playerList.length; ++i) {
        var playerindex = playerList[i];
        Players[playerindex].gamePos = currentLevel.startPos[i]; // 0: up, 1: left, 2: right, 3: down
        var player = Players[playerindex];
        var bid = player.gamePos.bid;
        player.position = {x:0, y:0};
        player.position.x = mapInfo[bid].x * GridLength;        
        player.position.y = mapInfo[bid].y * GridLength;
        player.realestate = 0;
        player.stocktot = 0;
        player.building = 0;
        player.status = 0;
        player.buddha = -1; // none
        player.robot = true;
        player.stock = [];
        for (var j=0, len=currentLevel.stockList.length; j<len; ++j) {
          player.stock.push({volume: 0, price: 0});
        }
        player.cards = []; // maximum: 9
        player.blocks = [];
      }

      currentPlayerIndex = 0;
      maxNumOfPlayers = playerList.length;
      currentPlayer = Players[playerList[currentPlayerIndex]];
      currentPlayer.robot = false;
      cityList = currentLevel.cityList;
      stockList = [];
      landList = [];
      // initialize stock market
      for (var i=0, l=currentLevel.stockList.length; i<l; ++i) {
        var price = Math.random() * 200 + 10; // No one can be lower than 10.00
        var volume = Math.floor(Math.random() * 18000) + 4000;
        var percent = (Math.random() * 5 - 2.5) / 100;
        var change = price * percent;
        var moveup = Math.floor(Math.random() * 2) == 0 ? true : false;
        stockList.push({name: currentLevel.stockList[i], 
                        price: price.toFixed(2), 
                        volume: volume,
                        change: change.toFixed(2), 
                        percent: percent,
                        moveup: moveup,
                        days: 0});
      }
      // Bind key intrupt
      $(document).keydown(function(e) {
        keyPressedCallbacks[Game.status](e);
      });      
      
      soldLands = new Array();
      bldgLands = new Array();
      for (var i=0; i<mapSize; ++i) {
        soldLands.push(new Array());
        bldgLands.push(new Array());
      }
      for (var key in mapInfo) {
        var block = mapInfo[key];
        if (block.t == 15) landList.push(block);
      }
      // Walk through mapInfo to multiply each block lx/ly with GridLength
      // Doing is to reduce the calculation in drawMap()
      for (var key in mapInfo) {
        var block = mapInfo[key];
        if (block.lx && block.ly) {
          block.mx = block.lx * GridLength;
          block.my = block.ly * GridLength;
          /*
          if (Game.debug) {
            block.owner = 1;
            block.bldg = 0;
            soldLands[block.lx].push(block);
            //bldgLands[block.lx].push(block);
          }
          */
        }
      }
      initbuddhaPosition();
    },
    
    run: function() {
      this.AnimateLoop = setInterval(animate, AnimationTimeout);
    }
  }
  
  function animate() {
    context.clearRect(0, 0, CanvasWidth, CanvasHeight);
    AnimateCallbacks[Game.status]();
    
  }
  
  Game.load();
  Game.run();

});