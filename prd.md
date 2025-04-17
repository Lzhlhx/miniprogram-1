# 微信小程序雾霾探测系统 - 产品需求文档

## 一、项目概述

雾霾的频繁出现已严重地影响到人们的出行，对人们的健康造成了重大影响。本系统旨在开发一款手机端微信小程序雾霾探测系统，让用户能在出行前查看雾霾指数，并采取相应的措施来把雾霾的影响降到最小。

## 二、功能需求

### 1. 定位功能

- 通过微信小程序获取用户当前位置
- 将定位城市保存在服务器端
- 同时在客户端显示当前城市
- 若无法获取位置，默认使用西安市作为默认位置
- 支持用户手动选择地点（POI），便于查看其他地点的天气和空气质量

### 2. 界面设计

- 主要分为头部(header)和主体(body)两部分
- 头部显示当前定位城市信息
- body部分包含天气和空气质量指数的动态显示
- 显示湿度温度折线图
- 采用响应式设计，适配不同手机屏幕尺寸

### 3. 天气详情和空气质量指数

- 通过和风天气API获取对应城市的天气详情和空气质量指数
- 获取的数据保存在服务器端
- 在客户端展示天气状况、温度、湿度、风向等信息
- 展示空气质量指数(AQI)及相关污染物数据
- 根据AQI等级提供相应的健康建议

### 4. 城市搜索功能

- 支持用户手动输入城市名称进行搜索
- 支持模糊搜索，用户只需输入城市名称的部分字符
- 支持多城市切换，可查看不同城市的天气和空气质量数据
- 搜索结果按照相关性排序展示

### 5. 地点选择功能

- 使用微信官方的POI地点选择功能
- 支持选择城市或精确位置
- 展示所选位置的天气和空气质量数据
- 保存用户常用地点，便于快速切换

## 三、技术规范

### 1. 位置获取API

使用微信小程序的位置API：`wx.getLocation`

```javascript
wx.getLocation({
  type: 'wgs84',
  success (res) {
    const latitude = res.latitude
    const longitude = res.longitude
    const speed = res.speed
    const accuracy = res.accuracy
  }
})
```

注意事项：
- 从2022年7月14日后发布的小程序，需要在app.json中进行位置权限声明
- 2.17.0版本起`wx.getLocation`增加调用频率限制
- 工具中定位模拟使用IP定位，可能会有一定误差，且工具目前仅支持gcj02坐标

### 1.1 地点选择API

使用微信小程序的POI选择API：`wx.choosePoi`

```javascript
wx.choosePoi({
  success(res) {
    // 用户选择了位置
    if (res.type === 1) {
      // 用户选择了城市
      console.log('选择的城市：', res.city)
    } else if (res.type === 2) {
      // 用户选择了精确位置
      console.log('位置名称：', res.name)
      console.log('详细地址：', res.address)
      console.log('经纬度：', res.longitude, res.latitude)
    }
  },
  fail() {
    // 用户取消选择
  }
})
```

注意事项：
- 从2022年7月14日后发布的小程序，需要在app.json中进行声明
- 需要用户授权位置权限(scope.userLocation)
- 支持两种选择模式：城市选择(type=1)和精确位置选择(type=2)
- 仅对与地理位置强相关的小程序开放，需在小程序管理后台开通权限

### 2. 天气和空气质量API

使用和风天气API获取天气和空气质量数据：

- API KEY: `683678c42e094af1bf0052a0c473b588`
- API Host: 每个开发者都有专属的API Host，在和风天气开发者控制台查看
- 实时天气API路径: `/v7/weather/now`
- 空气质量API路径: `/v7/air/now`

#### 2.1 API请求规范

请求格式示例：
```
curl -X GET --compressed \
-H 'X-QW-Api-Key: your_api_key' \
'https://your_api_host/v7/weather/now?location=101010100'
```

注意事项：
- 每个开发者有专属的API Host，必须使用开发者平台分配的域名
- 请求需要使用`X-QW-Api-Key`进行身份认证
- 请求需要进行Gzip压缩，接收响应时需解压
- 请求失败时应有适当的错误处理和备用数据方案

#### 2.2 实时天气API返回数据结构

```json
{
  "code": "200",
  "updateTime": "2020-06-30T22:00+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "now": {
    "obsTime": "2020-06-30T21:40+08:00",
    "temp": "24",
    "feelsLike": "26",
    "icon": "101",
    "text": "多云",
    "wind360": "123",
    "windDir": "东南风",
    "windScale": "1",
    "windSpeed": "3",
    "humidity": "72",
    "precip": "0.0",
    "pressure": "1003",
    "vis": "16",
    "cloud": "10",
    "dew": "21"
  },
  "refer": {
    "sources": ["QWeather", "NMC", "ECMWF"],
    "license": ["QWeather Developers License"]
  }
}
```

#### 2.3 空气质量API返回数据结构

新版API返回格式：
```json
{
  "metadata": {
    "tag": "d75a323239766b831889e8020cba5aca9b90fca5080a1175c3487fd8acb06e84"
  },
  "indexes": [
    {
      "code": "us-epa",
      "name": "AQI (US)",
      "aqi": 46,
      "aqiDisplay": "46",
      "level": "1",
      "category": "Good",
      "color": {
        "red": 0,
        "green": 228,
        "blue": 0,
        "alpha": 1
      },
      "primaryPollutant": {
        "code": "pm2p5",
        "name": "PM 2.5",
        "fullName": "Fine particulate matter (<2.5µm)"
      },
      "health": {
        "effect": "No health effects.",
        "advice": {
          "generalPopulation": "Everyone can continue their outdoor activities normally.",
          "sensitivePopulation": "Everyone can continue their outdoor activities normally."
        }
      }
    }
  ],
  "pollutants": [
    {
      "code": "pm2p5",
      "name": "PM 2.5",
      "fullName": "Fine particulate matter (<2.5µm)",
      "concentration": {
        "value": 11.0,
        "unit": "μg/m3"
      },
      "subIndexes": [
        {
          "code": "us-epa",
          "aqi": 46,
          "aqiDisplay": "46"
        }
      ]
    }
    // 其他污染物数据...
  ],
  "stations": [
    {
      "id": "P51762",
      "name": "North Holywood"
    }
    // 其他监测站信息...
  ]
}
```

#### 2.4 城市搜索API

城市搜索API提供全球地理位置、城市搜索服务，支持获取城市基本信息，提供模糊搜索功能：

- 请求路径: `/geo/v2/city/lookup`
- 功能: 根据城市名称、经纬度或ID获取城市信息，支持模糊搜索
- 用途: 获取城市的Location ID以便查询天气，实现APP中的城市搜索功能

##### 2.4.1 请求参数

主要请求参数：
- `location`(必选): 城市名称、经纬度或ID，支持模糊搜索
- `adm`: 上级行政区划，用于过滤重名城市
- `range`: 搜索范围，可限定在特定国家内搜索
- `number`: 返回结果数量，取值范围1-20，默认10个
- `lang`: 多语言设置

请求示例：
```
curl -X GET --compressed \
-H 'Authorization: Bearer your_token' \
'https://your_api_host/geo/v2/city/lookup?location=beij'
```

##### 2.4.2 返回数据结构

返回数据包含城市列表及基本信息：
```json
{
  "code":"200",
  "location":[
    {
      "name":"北京",
      "id":"101010100",
      "lat":"39.90499",
      "lon":"116.40529",
      "adm2":"北京",
      "adm1":"北京市",
      "country":"中国",
      "tz":"Asia/Shanghai",
      "utcOffset":"+08:00",
      "isDst":"0",
      "type":"city",
      "rank":"10",
      "fxLink":"https://www.qweather.com/weather/beijing-101010100.html"
    },
    // 其他城市结果...
  ],
  "refer":{
    "sources":["QWeather"],
    "license":["QWeather Developers License"]
  }
}
```

主要返回字段：
- `location.name`: 城市名称
- `location.id`: 城市ID，用于后续天气查询
- `location.lat`/`location.lon`: 城市经纬度
- `location.adm1`/`location.adm2`: 城市所属行政区域
- `location.country`: 城市所属国家
- `location.rank`: 城市评分，用于结果排序

##### 2.4.3 模糊搜索特性

- 支持用户输入城市名称的一部分进行搜索，最少一个汉字或2个字符
- 结果按照相关性和评分排序，便于用户选择
- 可处理城市重名情况，如多个"西安"，可通过`adm`参数进一步筛选

### 3. 空气质量指数(AQI)等级标准

| AQI范围 | 级别 | 颜色 | 健康影响 |
|--------|------|-----|---------|
| 0-50 | 优 | 绿色 | 空气质量令人满意，基本无空气污染 |
| 51-100 | 良 | 黄色 | 空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有弱影响 |
| 101-150 | 轻度污染 | 橙色 | 易感人群症状有轻度加剧，健康人群可能出现刺激症状 |
| 151-200 | 中度污染 | 红色 | 进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响 |
| 201-300 | 重度污染 | 紫色 | 心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状 |
| >300 | 严重污染 | 褐红色 | 健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病 |

## 四、开发注意事项

1. 界面设计应使用响应式布局，确保在不同尺寸的手机上都能正常显示
2. 实现定位功能时需提前获取用户授权
3. 当位置获取失败时，使用西安市作为默认位置
4. 空气质量数据需根据AQI值进行颜色和建议的动态展示
5. 温度和湿度数据需使用图表进行可视化展示，注意解决以下问题：
   - 减少显示的数据点，避免X轴标签重叠（建议每3-4小时显示一个点）
   - 添加错误处理机制，确保图表渲染失败时不影响其他功能
   - 使用wxCharts库的正确调用方式进行绘制
6. 实时天气数据有5-20分钟的延迟，请显示数据的观测时间
7. 所有网络请求需考虑超时处理和错误提示，API调用失败时使用模拟数据作为备用
8. 城市搜索功能需支持模糊搜索和错误处理
9. 实现城市历史记录功能，方便用户快速切换查看历史搜索过的城市
10. 地点选择功能(wx.choosePoi)需在app.json中进行权限声明
11. 用户选择的地点数据需与天气API对接，确保能获取相应地点的天气和空气质量信息