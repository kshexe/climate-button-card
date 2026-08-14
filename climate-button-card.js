// climate-button-card.js
// v1.0.0
// Vanilla JS custom Lovelace card for any climate entity (aircon, boiler, etc.)
// Compact horizontal layout: left info column (140px, 2 rows x 2 cols) + right button rows,
// matching the original button-card-templates design (aircon_info / power / mode / temp).

const STATE_LABELS = {
  cool: "냉방",
  heat: "난방",
  dry: "제습",
  fan_only: "송풍",
  off: "꺼짐",
};

const STATE_COLORS = {
  heat: "rgb(203, 79, 64)",
  cool: "rgb(68, 154, 223)",
  dry: "rgb(68, 154, 223)",
  fan_only: "rgb(68, 154, 223)",
  auto: "rgb(68, 154, 223)",
};

class ClimateButtonCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("entity(climate.xxx)를 지정해주세요");
    }
    this._config = {
      title: config.title || "",
      temps: config.temps || [26, 27, 28, 29],
      ...config,
    };
    this._built = false;
  }

  getCardSize() {
    return 2;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._render();
  }

  _callService(domain, service, data) {
    this._hass.callService(domain, service, data);
  }

  _haptic() {
    const event = new CustomEvent("haptic", {
      detail: "light",
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _moreInfo() {
    const event = new CustomEvent("hass-more-info", {
      detail: { entityId: this._config.entity },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _buildSkeleton() {
    this.innerHTML = `
      <ha-card>
        <style>
          ha-card { padding: 4px 0; background: transparent; box-shadow: none; border: none; }
          .cbc-wrap { display:flex; gap:8px; }
          .cbc-left {
            width: 88px;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 4px;
            background: #1c1c1c;
            border-radius: 10px;
          }
          .cbc-header { display:flex; justify-content:center; align-items:center; font-size:14px; cursor:pointer; }
          .cbc-info-grid { display:grid; grid-template-columns: auto 1fr; column-gap:4px; row-gap:3px; align-items:center; }
          .cbc-badge { border-radius:5px; padding:0 3px; text-align:center; font-size:10px; white-space:nowrap; }
          .cbc-value { font-size:12px; }
          .cbc-right { flex:1; display:flex; flex-direction:column; gap:8px; justify-content:center; }
          .cbc-btnrow { display:flex; gap:6px; }
          .cbc-btn {
            flex:1;
            border-radius:10px;
            height:40px;
            font-size:14px;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            user-select:none;
            background: #1c1c1c;
          }
          .cbc-btn.cbc-disabled { cursor:not-allowed; }
          .cbc-power { display:flex; align-items:center; justify-content:center; }
          .cbc-warning { padding:16px; color:var(--error-color); }
        </style>
        <div class="cbc-body"></div>
      </ha-card>
    `;
    this._body = this.querySelector(".cbc-body");
    this._built = true;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._buildSkeleton();

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this._body.innerHTML = `<div class="cbc-warning">Entity not found: ${this._config.entity}</div>`;
      return;
    }

    const state = stateObj.state;
    const current = stateObj.attributes.current_temperature;
    const target = stateObj.attributes.temperature;
    const hasTarget = state !== "off" && target !== null && target !== undefined;
    const color = STATE_COLORS[state] || "rgb(68, 154, 223)";
    const label = STATE_LABELS[state] || state;
    const MODE_ORDER = ["cool", "dry", "fan_only", "heat"];
    const modes = (stateObj.attributes.hvac_modes || [])
      .filter((m) => m !== "off" && STATE_LABELS[m])
      .sort((a, b) => MODE_ORDER.indexOf(a) - MODE_ORDER.indexOf(b));

    const tempSensor = this._config.temp_sensor ? this._hass.states[this._config.temp_sensor] : null;
    const humiSensor = this._config.humi_sensor ? this._hass.states[this._config.humi_sensor] : null;

    let html = `<div class="cbc-wrap">`;

    // ===== left info column =====
    html += `<div class="cbc-left">`;
    html += `
      <div class="cbc-header" id="cbc-header">
        <span style="color:${state !== "off" ? color : ""}">${this._config.title}</span>
      </div>
    `;
    // 현재/온도/습도 - 한 줄(3칸) grid로 배치, 설정 표시는 제거
    html += `<div class="cbc-info-grid">`;
    html += `
      <span class="cbc-badge" style="border:1px solid white">현재</span>
      <span class="cbc-value">${current !== undefined ? current + "°" : "-"}</span>
    `;
    if (tempSensor) {
      const tVal = parseFloat(tempSensor.state);
      let tColor = "";
      if (tVal < 20) tColor = "rgb(68, 154, 223)";
      else if (tVal > 26) tColor = "rgb(203, 79, 64)";
      html += `
        <span class="cbc-badge" style="border:1px solid rgb(203, 79, 64)">온도</span>
        <span class="cbc-value" style="color:${tColor}">${tVal.toFixed(1)}°</span>
      `;
    } else {
      html += `<span></span><span></span>`;
    }
    if (humiSensor) {
      const hVal = parseFloat(humiSensor.state);
      let hColor = "";
      if (hVal < 40) hColor = "rgb(203, 79, 64)";
      else if (hVal > 60) hColor = "rgb(68, 154, 223)";
      html += `
        <span class="cbc-badge" style="border:1px solid rgb(68, 154, 223)">습도</span>
        <span class="cbc-value" style="color:${hColor}">${hVal.toFixed(1)}%</span>
      `;
    } else {
      html += `<span></span><span></span>`;
    }
    html += `</div>`;
    html += `</div>`; // .cbc-left

    // ===== right button columns =====
    html += `<div class="cbc-right">`;

    html += `<div class="cbc-btnrow">`;
    html += `
      <div class="cbc-btn cbc-power" id="cbc-power" style="${
        state === "off" ? "background:rgb(203, 79, 64)" : ""
      }">
        <ha-icon icon="mdi:power"></ha-icon>
      </div>
    `;
    modes.forEach((mode) => {
      const active = state === mode;
      html += `
        <div class="cbc-btn cbc-mode" data-mode="${mode}" style="${
          active ? `background:${STATE_COLORS[mode] || color}` : ""
        }">
          ${STATE_LABELS[mode] || mode}
        </div>
      `;
    });
    html += `</div>`;

    html += `<div class="cbc-btnrow">`;
    (this._config.temps || []).forEach((t) => {
      const selected = hasTarget && target == t;
      html += `
        <div class="cbc-btn cbc-temp ${hasTarget ? "" : "cbc-disabled"}" data-temp="${t}"
          style="${selected ? `background:${color}` : ""}; opacity:${hasTarget ? "1" : "0.4"}">
          ${t}℃
        </div>
      `;
    });
    html += `</div>`;

    html += `</div>`; // .cbc-right
    html += `</div>`; // .cbc-wrap

    this._body.innerHTML = html;

    // wire events
    this._body.querySelector("#cbc-header").addEventListener("click", () => this._moreInfo());
    this._body.querySelector("#cbc-power").addEventListener("click", () => {
      this._haptic();
      this._callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: "off",
      });
    });
    this._body.querySelectorAll(".cbc-mode").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._haptic();
        this._callService("climate", "set_hvac_mode", {
          entity_id: this._config.entity,
          hvac_mode: btn.dataset.mode,
        });
      });
    });
    this._body.querySelectorAll(".cbc-temp").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("cbc-disabled")) return;
        this._haptic();
        this._callService("climate", "set_temperature", {
          entity_id: this._config.entity,
          temperature: parseFloat(btn.dataset.temp),
        });
      });
    });
  }
}

customElements.define("climate-button-card", ClimateButtonCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "climate-button-card",
  name: "Climate Button Card",
  description: "에어컨/보일러 등 climate entity 공용 카드",
});

console.info(
  "%c CLIMATE-BUTTON-CARD %c v1.0.0 ",
  "color:white;background:rgb(68,154,223);font-weight:700;",
  "color:rgb(68,154,223);background:white;font-weight:700;"
);
