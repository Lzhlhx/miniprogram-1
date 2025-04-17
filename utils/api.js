// 和风天气 API 配置
const WEATHER_KEY = '683678c42e094af1bf0052a0c473b588';
// 使用用户专属的API Host域名
const API_HOST = 'mx4gkguhd7.re.qweatherapi.com';  // 专属API域名

// 构建API基础URL
const WEATHER_BASE_URL = `https://${API_HOST}/v7`;
// 地理位置API使用通用域名
const GEO_BASE_URL = `https://geoapi.qweather.com/v2`;
const AIR_BASE_URL = `https://${API_HOST}/v7/air`;

// 西安市的默认位置信息
const DEFAULT_LOCATION = {
  cityId: '101110101', // 西安市的城市ID
  cityName: '西安市',
  latitude: 34.26,
  longitude: 108.95
};

// 添加模拟数据，用于API失败时的备用数据
const MOCK_WEATHER = {
  code: "200",
  updateTime: "2023-12-01T10:00+08:00",
  now: {
    obsTime: "2023-12-01T09:40+08:00",
    temp: "15",
    feelsLike: "14",
    icon: "100",
    text: "晴",
    wind360: "45",
    windDir: "东北风",
    windScale: "3",
    windSpeed: "15",
    humidity: "40",
    precip: "0.0",
    pressure: "1015",
    vis: "25",
    cloud: "10",
    dew: "8"
  }
};

const MOCK_AIR = {
  code: "200",
  updateTime: "2023-12-01T10:00+08:00",
  now: {
    pubTime: "2023-12-01T09:00+08:00",
    aqi: "75",
    level: "2",
    category: "良",
    primary: "PM2.5",
    pm10: "85",
    pm2p5: "55",
    no2: "30",
    so2: "10",
    co: "0.8",
    o3: "35"
  }
};

const MOCK_HOURLY = {
  code: "200",
  updateTime: "2023-12-01T10:00+08:00",
  hourly: [
    {
      fxTime: "2023-12-01T10:00+08:00",
      temp: "15",
      icon: "100",
      text: "晴",
      wind360: "45",
      windDir: "东北风",
      windScale: "3",
      windSpeed: "15",
      humidity: "40",
      pop: "0",
      precip: "0.0",
      pressure: "1015",
      cloud: "10",
      dew: "8"
    },
    {
      fxTime: "2023-12-01T11:00+08:00",
      temp: "16",
      icon: "100",
      text: "晴",
      wind360: "45",
      windDir: "东北风",
      windScale: "3",
      windSpeed: "15",
      humidity: "38",
      pop: "0",
      precip: "0.0",
      pressure: "1015",
      cloud: "10",
      dew: "8"
    },
    // 添加模拟数据...
    {
      fxTime: "2023-12-01T12:00+08:00",
      temp: "17",
      icon: "100",
      text: "晴",
      wind360: "45",
      windDir: "东北风",
      windScale: "3",
      windSpeed: "15",
      humidity: "35",
      pop: "0",
      precip: "0.0",
      pressure: "1014",
      cloud: "10",
      dew: "7"
    }
  ]
};

// 扩展模拟24小时数据
for (let i = 0; i < 21; i++) {
  const hour = (13 + i) % 24;
  const temp = 17 - Math.floor(i / 3);
  const humidity = 35 + Math.floor(i / 2);
  MOCK_HOURLY.hourly.push({
    fxTime: `2023-12-01T${hour < 10 ? '0' + hour : hour}:00+08:00`,
    temp: temp.toString(),
    icon: "100",
    text: hour >= 18 || hour < 6 ? "晴" : "多云",
    wind360: "45",
    windDir: "东北风",
    windScale: "3",
    windSpeed: "15",
    humidity: humidity.toString(),
    pop: "0",
    precip: "0.0",
    pressure: "1014",
    cloud: "10",
    dew: "7"
  });
}

// 定位城市并获取城市ID
const getLocation = () => {
  return new Promise((resolve, reject) => {
    try {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const { latitude, longitude } = res;
          // 使用坐标逆解析为城市
          wx.request({
            url: `${GEO_BASE_URL}/city/lookup?location=${longitude},${latitude}`,
            header: {
              'X-QW-Api-Key': WEATHER_KEY,
              'Accept-Encoding': 'gzip,deflate'
            },
            enableHttp2: true,
            enableQuic: true,
            enableCache: true,
            success: (res) => {
              if (res.data.code === '200' && res.data.location && res.data.location.length > 0) {
                const cityInfo = res.data.location[0];
                resolve({
                  cityId: cityInfo.id,
                  cityName: cityInfo.name,
                  latitude,
                  longitude
                });
              } else {
                console.log('无法获取城市信息，使用默认位置', res.data);
                resolve(DEFAULT_LOCATION);
              }
            },
            fail: (err) => {
              console.log('请求城市信息失败，使用默认位置', err);
              resolve(DEFAULT_LOCATION);
            }
          });
        },
        fail: (err) => {
          console.log('获取位置失败，使用默认位置', err);
          resolve(DEFAULT_LOCATION);
        }
      });
    } catch (error) {
      console.log('位置获取异常，使用默认位置', error);
      resolve(DEFAULT_LOCATION);
    }
  });
};

// 使用默认位置
const getDefaultLocation = () => {
  return Promise.resolve(DEFAULT_LOCATION);
};

// 获取实时天气
const getNowWeather = (cityId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${WEATHER_BASE_URL}/weather/now?location=${cityId}`,
      // 正确的身份认证方式：使用X-QW-Api-Key头部
      header: {
        'X-QW-Api-Key': WEATHER_KEY,
        'Accept-Encoding': 'gzip,deflate' // 支持接收压缩数据
      },
      enableHttp2: true,
      enableQuic: true,
      enableCache: true,
      success: (res) => {
        if (res.data.code === '200') {
          resolve(res.data);
        } else {
          console.warn('实时天气API返回错误，使用模拟数据', res.data);
          resolve(MOCK_WEATHER);
        }
      },
      fail: (err) => {
        console.error('实时天气API请求失败，使用模拟数据:', err);
        resolve(MOCK_WEATHER);
      }
    });
  });
};

// 获取空气质量
const getAirQuality = (location) => {
  return new Promise((resolve, reject) => {
    const cityId = typeof location === 'string' ? location : location.cityId;
    
    wx.request({
      url: `${WEATHER_BASE_URL}/air/now?location=${cityId}`,
      header: {
        'X-QW-Api-Key': WEATHER_KEY,
        'Accept-Encoding': 'gzip,deflate'
      },
      enableHttp2: true,
      enableQuic: true,
      enableCache: true,
      success: (res) => {
        if (res.data.code === '200') {
          resolve(res.data);
        } else {
          console.warn('空气质量API返回错误，使用模拟数据', res.data);
          resolve(MOCK_AIR);
        }
      },
      fail: (err) => {
        console.error('空气质量API请求失败，使用模拟数据:', err);
        resolve(MOCK_AIR);
      }
    });
  });
};

// 辅助函数：从污染物数组中获取特定污染物的值
function getPollutantValue(pollutants, code) {
  if (!pollutants) return '0';
  const pollutant = pollutants.find(p => p.code === code);
  return pollutant ? pollutant.concentration.value.toString() : '0';
}

// 获取未来24小时天气预报
const getHourlyWeather = (cityId) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${WEATHER_BASE_URL}/weather/24h?location=${cityId}`,
      header: {
        'X-QW-Api-Key': WEATHER_KEY,
        'Accept-Encoding': 'gzip,deflate'
      },
      enableHttp2: true,
      enableQuic: true,
      enableCache: true,
      success: (res) => {
        if (res.data && res.data.code === '200') {
          resolve(res.data);
        } else {
          console.warn('小时预报API返回错误，使用模拟数据', res.data);
          resolve(MOCK_HOURLY);
        }
      },
      fail: (err) => {
        console.error('请求24小时天气预报API失败，使用模拟数据:', err);
        resolve(MOCK_HOURLY);
      }
    });
  });
};

module.exports = {
  getLocation,
  getDefaultLocation,
  getNowWeather,
  getAirQuality,
  getHourlyWeather,
  DEFAULT_LOCATION
}; 