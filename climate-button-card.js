// climate-button-card.js
// Shared custom Lovelace card for any climate entity (aircon, boiler, etc.)
// No build step needed — reuses LitElement already loaded by Home Assistant frontend.

const LitElement = Object.getPrototypeOf(
  customElements.get("hui-view") || customElements.get("hui-masonry-view")
);
const { html, css } = LitElement.prototype;

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

class ClimateButtonCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("entity(climate.xxx)를 지정해주세요");
    }
    this.config = {
      title: config.title || "",
      temps: config.temps || [26, 27, 28, 29],
      ...config,
    };
  }

  getCardSize() {
    return 3;
  }

  _stateObj() {
    return this.hass.states[this.config.entity];
  }

  _callMode(mode) {
    this.hass.callService("climate", "set_hvac_mode", {
      entity_id: this.config.entity,
      hvac_mode: mode,
    });
  }

  _callTemp(temp) {
    this.hass.callService("climate", "set_temperature", {
      entity_id: this.config.entity,
      temperature: temp,
    });
  }

  _callOff() {
    this._callMode("off");
  }

  _moreInfo() {
    const event = new CustomEvent("hass-more-info", {
      detail: { entityId: this.config.entity },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const stateObj = this._stateObj();
    if (!stateObj) {
      return html`<ha-card
        ><div class="warning">
          Entity not found: ${this.config.entity}
        </div></ha-card
      >`;
    }

    const state = stateObj.state;
    const current = stateObj.attributes.current_temperature;
    const target = stateObj.attributes.temperature;
    const hasTarget = state !== "off" && target !== null && target !== undefined;
    const color = STATE_COLORS[state] || "rgb(68, 154, 223)";
    const label = STATE_LABELS[state] || state;

    const tempSensor = this.config.temp_sensor
      ? this.hass.states[this.config.temp_sensor]
      : null;
    const humiSensor = this.config.humi_sensor
      ? this.hass.states[this.config.humi_sensor]
      : null;

    const modes = (stateObj.attributes.hvac_modes || []).filter(
      (m) => m !== "off"
    );

    return html`
      <ha-card>
        <div class="header" @click=${this._moreInfo}>
          <span class="title">${this.config.title}</span>
          <span class="state" style="color:${state !== "off" ? color : ""}"
            >${label}</span
          >
        </div>

        <div class="temps-row">
          <div class="temp-box">
            <span class="temp-name">현재</span>
            <span class="temp-value"
              >${current !== undefined ? current + "°" : "-"}</span
            >
          </div>
          <div
            class="temp-box"
            style="border-color:${state !== "off" ? color : "white"}"
          >
            <span class="temp-name">설정</span>
            <span class="temp-value"
              >${hasTarget ? target + "°" : "-"}</span
            >
          </div>
        </div>

        ${tempSensor || humiSensor
          ? html`
              <div class="temps-row">
                ${tempSensor
                  ? html`
                      <div class="temp-box">
                        <span class="temp-name">온도</span>
                        <span class="temp-value"
                          >${parseFloat(tempSensor.state).toFixed(1)}°</span
                        >
                      </div>
                    `
                  : ""}
                ${humiSensor
                  ? html`
                      <div class="temp-box">
                        <span class="temp-name">습도</span>
                        <span class="temp-value"
                          >${parseFloat(humiSensor.state).toFixed(1)}%</span
                        >
                      </div>
                    `
                  : ""}
              </div>
            `
          : ""}

        <div class="button-row">
          <button
            class="power-btn"
            style="background:${state === "off"
              ? "rgb(203, 79, 64)"
              : "rgba(120,120,120,0.15)"}"
            @click=${this._callOff}
          >
            <ha-icon icon="mdi:power"></ha-icon>
          </button>
          ${modes.map(
            (mode) => html`
              <button
                class="mode-btn"
                style="background:${state === mode
                  ? STATE_COLORS[mode] || color
                  : ""}"
                @click=${() => this._callMode(mode)}
              >
                ${STATE_LABELS[mode] || mode}
              </button>
            `
          )}
        </div>

        <div class="button-row">
          ${this.config.temps.map(
            (t) => html`
              <button
                class="temp-btn"
                ?disabled=${!hasTarget}
                style="background:${hasTarget && target == t
                  ? color
                  : hasTarget
                  ? ""
                  : "rgba(120,120,120,0.15)"}; opacity:${hasTarget
                  ? "1"
                  : "0.3"}"
                @click=${() => this._callTemp(t)}
              >
                ${t}℃
              </button>
            `
          )}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        padding: 12px 16px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        margin-bottom: 10px;
        cursor: pointer;
      }
      .title {
        font-weight: 500;
      }
      .temps-row {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }
      .temp-box {
        flex: 1;
        display: flex;
        justify-content: space-between;
        border: 1px solid var(--divider-color, #444);
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 12px;
      }
      .temp-name {
        opacity: 0.7;
      }
      .temp-value {
        font-weight: 600;
      }
      .button-row {
        display: flex;
        gap: 6px;
        margin-bottom: 6px;
      }
      button {
        flex: 1;
        border: none;
        border-radius: 10px;
        height: 35px;
        font-size: 12px;
        color: var(--primary-text-color);
        background: rgba(120, 120, 120, 0.15);
        cursor: pointer;
      }
      button:disabled {
        cursor: not-allowed;
      }
      .power-btn {
        flex: 0 0 45px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .warning {
        padding: 16px;
        color: var(--error-color);
      }
    `;
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
  "%c CLIMATE-BUTTON-CARD %c v0.1.0 ",
  "color:white;background:rgb(68,154,223);font-weight:700;",
  "color:rgb(68,154,223);background:white;font-weight:700;"
);
