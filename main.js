// ==UserScript==
// @name         Slitherify
// @version      0.1
// @description  Some enhancements for slither.io game.
// @author       dermv
// @match        http://slither.com/io
// @grant        GM_addStyle
// @noframes
// @downloadURL
// @updateURL
// ==/UserScript==


///////////////////////////////////////////////////////////////////////////////
//                                   Zoom.                                   //
///////////////////////////////////////////////////////////////////////////////


MAX_ZOOM = 3;
MIN_ZOOM = 0.2;
ZOOM_RATE = 0.1;

zoomLevel = 0.9;

const handleWheel = (event) => {
  if (event.ctrlKey || event.metaKey) return;
  event.preventDefault();

  // Adjust zoom based on scroll direction: down (-1) decreases,
  // up (1) increases.
  const direction = event.deltaY > 0 ? -1 : 1;
  zoomLevel = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, zoomLevel + ZOOM_RATE * direction),
  );
};

const renderZoom = () => {
  unsafeWindow.gsc = zoomLevel;
  requestAnimationFrame(renderZoom);
};

document.addEventListener('wheel', handleWheel, { passive: false });
requestAnimationFrame(renderZoom);


///////////////////////////////////////////////////////////////////////////////
//                           Full unlock cosmetics.                          //
///////////////////////////////////////////////////////////////////////////////


// Show button for cosmetics selection and cosmetics options.
document.getElementById('csk').addEventListener('click', () => {
  scosh.style.display = 'inline';
  for (i in actco) {
    actco[i] = 1;
  }
});

// The wrapper for installing the accessory when creating the slither.
const newSlither_ = unsafeWindow.newSlither;
unsafeWindow.newSlither = function(
    id, xx, yy, cv, ang, pts, msl, custom_skin_uint8, accessory = 255) {
  const wrapper = newSlither_(id, xx, yy, cv, ang, pts, msl, custom_skin_uint8);
  wrapper.accessory = accessory;
  return wrapper;
};

// The wrapper to send the selected accessory to the server.
const startLogin_ = unsafeWindow.startLogin;
unsafeWindow.startLogin = function(ba) {
  const wrapper = startLogin_(ba);
  lgba[27 + nick.value.length] = localStorage.cosmetic;
  return wrapper;
};

// The wrapper for placing slither accessories around the player.
Object.defineProperty(unsafeWindow, 'gotPacket', (() => {
  let wrapper;
  let isWrapped = false;

  return {
    get() {
      return wrapper;
    },
    set(gotPacket_) {
      if (typeof gotPacket_ === 'function' && !isWrapped) {
        wrapper = function(data) {
          gotPacket_.call(this, data);

          if (String.fromCharCode(data[0]) === 's' &&
              playing &&
              data.length > 7) {
            let index = 22;
            for (let i = 0; i < 2; i++) {
              index += data[index] + 1;
            }

            const id = (data[1] << 8) | data[2];
            const accessory = data[index];
            for (const s of slithers) {
              if (s.id === id) {
                s.accessory = accessory;
                break;
              }
            }
          }
        };
        isWrapped = true;
      }
    },
    configurable: true,
  };
})());


///////////////////////////////////////////////////////////////////////////////
//                                  Overlay.                                 //
///////////////////////////////////////////////////////////////////////////////


// Create the overlay element.
let overlay = document.createElement('span');
overlay.className = 'nsi';
Object.assign(overlay.style, {
  position: 'fixed',
  left: '8px',
  top: '8px',
  color: 'rgba(255, 255, 255, .5)',
  opacity: '0',
  zIndex: '7',
  fontSize: '12px',
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
});
document.body.appendChild(overlay);

/**
 * Returns a function that calculates the FPS.
 * @returns {function(): number}
 */
const fpsHandler = () => {
  let lastTime = performance.now();
  let frames = 0;
  let fps = 0;

  const update = () => {
    frames++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fps = frames;
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);

  return () => fps;
};

/**
 * Returns a function that calculates the ping.
 * @returns {function(): number}
 */
const pingHandler = () => {
  // FIXME: Need something better...
  const alpha = 0.2;
  let ping = 50;

  return () => {
    const raw = Math.round(performance.now() - lpstm);
    ping = alpha * raw + (1 - alpha) * ping;
    return Math.round(ping);
  };
};

const getFps = fpsHandler();
const getPing = pingHandler();

let oef_ = unsafeWindow.oef;
let lastOefUpdate = performance.now();
unsafeWindow.oef = () => {
  oef_();
  
  if (playing && performance.now() - lastOefUpdate >= 1000) {
    overlay.innerHTML =
        `<span>FPS: ${getFps()}<br>` +
        `Ping: ${getPing()}ms<br>` +
        `<br>` +
        `Nick: ${nick.value}</span>`;
    lastOefUpdate = performance.now();
  }

  if (login_fr !== 0 && lb_fr !== -1) {
    overlay.style.opacity = lb_fr;
  }
};


///////////////////////////////////////////////////////////////////////////////
//                             Some enhancements.                            //
///////////////////////////////////////////////////////////////////////////////


// Load saved nick and update it on input change.
nick.value = localStorage.getItem('nick') || '';
nick.addEventListener('input', () => {
  localStorage.setItem('nick', nick.value);
});
