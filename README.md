# climate-button-card

에어컨, 보일러 등 모든 `climate` entity에 공용으로 쓸 수 있는 커스텀 Lovelace 카드.

## 설치

### HACS (Custom repository)

1. HACS → 우측 상단 ⋮ → **Custom repositories**
2. Repository: `https://github.com/<your-username>/climate-button-card`
3. Category: **Dashboard (Plugin)**

### 수동 설치

1. `climate-button-card.js`를 `config/www/climate-button-card/` 폴더에 복사
2. 설정 → 대시보드 → 리소스 → 리소스 추가
   - URL: `/local/climate-button-card/climate-button-card.js`
   - 리소스 타입: JavaScript 모듈

## 사용법

### 거실보일러

```yaml
type: custom:climate-button-card
entity: climate.urijib_gagbang_geosilboilreo
title: 거실보일러
temps:
  - 26
  - 27
  - 28
  - 29
```

### 이서에어컨 (온습도 센서 포함)

```yaml
type: custom:climate-button-card
entity: climate.iseoeeokeon
title: 이서에어컨
temp_sensor: sensor.iseobangonseubdo_temperature
humi_sensor: sensor.iseobangonseubdo_humidity
temps:
  - 18
  - 25
  - 26
  - 27
```

모드 버튼(냉방/난방/제습/송풍 등)은 따로 지정할 필요 없이, entity의 `hvac_modes` attribute를 그대로 읽어서 자동 생성됩니다. 보일러는 `off, heat`만 있으니 "난방" 버튼 하나만 뜨고, 에어컨은 `off, cool, dry, fan_only`가 있으니 세 버튼이 자동으로 뜹니다.

## 옵션

| 옵션          | 설명                        | 필수 | 기본값              |
| ------------- | --------------------------- | ---- | -------------------- |
| `entity`      | climate entity              | 예   | -                     |
| `title`       | 카드 제목                   | 아니오 | ""                  |
| `temp_sensor` | 실내 온도 센서 (선택)       | 아니오 | -                    |
| `humi_sensor` | 실내 습도 센서 (선택)       | 아니오 | -                    |
| `temps`       | 온도 설정 버튼 목록         | 아니오 | `[26, 27, 28, 29]`   |

`temp_sensor`/`humi_sensor`를 안 넣으면 해당 행이 아예 표시되지 않습니다.

상태(`cool`/`heat`/`dry`/`fan_only`/`auto`/`off`)별 한글 라벨과 색상(냉방 계열=파랑, 난방=빨강)은 카드에 내장되어 있어 별도 설정이 필요 없습니다.
