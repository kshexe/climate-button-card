// climate-button-card.js
// Vanilla JS custom Lovelace card for any climate entity (aircon, boiler, etc.)
// No LitElement dependency — plain Web Component, works regardless of HA frontend's internal Lit version.

const STATE_LABELS = {
  cool: "냉방",
  heat: "난방",
  dry: "제습",
  fan_only: "송풍",
  auto: "자동",
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
    return 3;
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
          ha-card { padding: 12px 16px; }
          .cbc-header { display:flex; justify-content:space-between; align-items:center; font-size:14px; margin-bottom:10px; cursor:pointer; }
          .cbc-title { font-weight:500; }
          .cbc-row { display:flex; gap:8px; margin-bottom:10px; }
          .cbc-box { flex:1; display:flex; justify-content:space-between; border:1px solid var(--divider-color,#444); border-radius:8px; padding:6px 10px; font-size:12px; }
          .cbc-box-name { opacity:0.7; }
          .cbc-box-value { font-weight:600; }
          .cbc-btnrow { display:flex; gap:6px; margin-bottom:6px; }
          .cbc-btn { flex:1; border:none; border-radius:10px; height:35px; font-size:12px; color:var(--primary-text-color); background:rgba(120,120,120,0.15); cursor:pointer; }
          .cbc-btn:disabled { cursor:not-allowed; }
          .cbc-power { flex:0 0 45px; display:flex; align-items:center; justify-content:center; }
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
    const modes = (stateObj.attributes.hvac_modes || []).filter((m) => m !== "off");

    const tempSensor = this._config.temp_sensor ? this._hass.states[this._config.temp_sensor] : null;
    const humiSensor = this._config.humi_sensor ? this._hass.states[this._config.humi_sensor] : null;

    let html = `
      <div class="cbc-header" id="cbc-header">
        <span class="cbc-title">${this._config.title}</span>
        <span style="color:${state !== "off" ? color : ""}">${label}</span>
      </div>
      <div class="cbc-row">
        <div class="cbc-box">
          <span class="cbc-box-name">현재</span>
          <span class="cbc-box-value">${current !== undefined ? current + "°" : "-"}</span>
        </div>
        <div class="cbc-box" style="border-color:${state !== "off" ? color : "white"}">
          <span class="cbc-box-name">설정</span>
          <span class="cbc-box-value">${hasTarget ? target + "°" : "-"}</span>
        </div>
      </div>
    `;

    if (tempSensor || humiSensor) {
      html += `<div class="cbc-row">`;
      if (tempSensor) {
        html += `
          <div class="cbc-box">
            <span class="cbc-box-name">온도</span>
            <span class="cbc-box-value">${parseFloat(tempSensor.state).toFixed(1)}°</span>
          </div>
        `;
      }
      if (humiSensor) {
        html += `
          <div class="cbc-box">
            <span class="cbc-box-name">습도</span>
            <span class="cbc-box-value">${parseFloat(humiSensor.state).toFixed(1)}%</span>
          </div>
        `;
      }
      html += `</div>`;
    }

    html += `<div class="cbc-btnrow">`;
    html += `
      <button class="cbc-btn cbc-power" id="cbc-power" style="background:${
        state === "off" ? "rgb(203, 79, 64)" : "rgba(120,120,120,0.15)"
      }">
        <ha-icon icon="mdi:power"></ha-icon>
      </button>
    `;
    modes.forEach((mode) => {
      const active = state === mode;
      html += `
        <button class="cbc-btn cbc-mode" data-mode="${mode}" style="background:${
          active ? STATE_COLORS[mode] || color : ""
        }">
          ${STATE_LABELS[mode] || mode}
        </button>
      `;
    });
    html += `</div>`;

    html += `<div class="cbc-btnrow">`;
    (this._config.temps || []).forEach((t) => {
      const selected = hasTarget && target == t;
      html += `
        <button class="cbc-btn cbc-temp" data-temp="${t}" ${hasTarget ? "" : "disabled"}
          style="background:${
            selected ? color : hasTarget ? "" : "rgba(120,120,120,0.15)"
          }; opacity:${hasTarget ? "1" : "0.3"}">
          ${t}℃
        </button>
      `;
    });
    html += `</div>`;

    this._body.innerHTML = html;

    // wire events
    this._body.querySelector("#cbc-header").addEventListener("click", () => this._moreInfo());
    this._body.querySelector("#cbc-power").addEventListener("click", () =>
      this._callService("climate", "set_hvac_mode", {
        entity_id: this._config.entity,
        hvac_mode: "off",
      })
    );
    this._body.querySelectorAll(".cbc-mode").forEach((btn) => {
      btn.addEventListener("click", () =>
        this._callService("climate", "set_hvac_mode", {
          entity_id: this._config.entity,
          hvac_mode: btn.dataset.mode,
        })
      );
    });
    this._body.querySelectorAll(".cbc-temp").forEach((btn) => {
      btn.addEventListener("click", () =>
        this._callService("climate", "set_temperature", {
          entity_id: this._config.entity,
          temperature: parseFloat(btn.dataset.temp),
        })
      );
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
  "%c CLIMATE-BUTTON-CARD %c v0.2.0 ",
  "color:white;background:rgb(68,154,223);font-weight:700;",
  "color:rgb(68,154,223);background:white;font-weight:700;"
);
