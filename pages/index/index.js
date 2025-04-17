// index.js
const api = require('../../utils/api');
const aqiUtil = require('../../utils/aqiUtil');
const wxCharts = require('../../utils/wxCharts');

Page({
  data: {
    cityName: '正在定位...',
    weatherInfo: null,
    airQuality: null,
    hourlyData: null,
    loading: true,
    today: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
    week: new Date().toLocaleDateString('zh-CN', { weekday: 'long' }),
    aqiInfo: null,
    error: null,
    showUpdateTime: false,
    isDefaultLocation: false, // 是否使用默认位置
    renderingCharts: false
  },

  onLoad: function() {
    this.getWeatherData();
  },

  onReady: function() {
    // 页面首次渲染完成后，可以安全地绘制图表
    if (this.data.hourlyData) {
      this.drawCharts();
    }
  },

  onShow: function() {
    // 页面显示时，如有数据可以重新绘制图表
    if (this.data.hourlyData && !this.data.loading) {
      this.drawCharts();
    }
  },

  onHide: function() {
    // 页面隐藏时记录状态，防止多余的图表渲染
    this.setData({
      renderingCharts: false
    });
  },

  onPullDownRefresh: function() {
    this.getWeatherData();
    wx.stopPullDownRefresh();
  },

  // 获取天气数据
  getWeatherData: function() {
    wx.showLoading({
      title: '正在加载数据',
    });

    this.setData({
      loading: true,
      error: null
    });

    // 获取位置信息 - 现在它会在失败时返回默认位置
    api.getLocation()
      .then(locationData => {
        // 判断是否为默认位置
        const isDefault = locationData.cityId === api.DEFAULT_LOCATION.cityId;
        
        this.setData({
          cityName: locationData.cityName,
          isDefaultLocation: isDefault
        });

        // 获取实时天气
        return api.getNowWeather(locationData.cityId)
          .then(weatherData => {
            this.setData({
              weatherInfo: weatherData.now,
              showUpdateTime: true
            });
            return locationData; // 传递位置信息到下一个Promise
          })
          .catch(err => {
            console.error('获取天气数据失败', err);
            this.setData({
              error: '获取天气数据失败'
            });
            return locationData; // 即使失败也继续执行
          });
      })
      .then(locationData => {
        // 获取空气质量 - 使用新的API并传递完整的位置信息
        return api.getAirQuality(locationData)
          .then(airData => {
            const airNow = airData.now;
            const aqiInfo = aqiUtil.getAQIInfo(airNow.aqi);
            
            this.setData({
              airQuality: airNow,
              aqiInfo: aqiInfo
            });
            return locationData; // 传递位置信息到下一个Promise
          })
          .catch(err => {
            console.error('获取空气质量数据失败', err);
            this.setData({
              error: '获取空气质量数据失败'
            });
            return locationData; // 即使失败也继续执行
          });
      })
      .then(locationData => {
        // 获取24小时预报数据
        return api.getHourlyWeather(locationData.cityId)
          .then(hourlyData => {
            this.setData({
              hourlyData: hourlyData.hourly.slice(0, 24),
              loading: false
            });

            wx.hideLoading();
            
            // 使用集中的图表绘制方法
            this.drawCharts();
          })
          .catch(err => {
            console.error('获取小时预报数据失败', err);
            this.setData({
              loading: false,
              error: '获取小时预报数据失败'
            });
            wx.hideLoading();
          });
      })
      .catch(err => {
        console.error('获取数据链出错', err);
        // 这里已经不会执行到，因为getLocation在失败时会返回默认位置
        // 但保留以防万一
        this.setData({
          loading: false,
          error: '获取数据失败，请重试'
        });
        wx.hideLoading();
      });
  },
  
  // 绘制温度图表
  drawTempChart: function() {
    try {
      console.log('开始绘制温度图表');
      if (!this.data.hourlyData) {
        console.error('绘制温度图表失败: 没有hourlyData数据');
        return;
      }
      
      // 检查canvas元素是否存在
      const query = wx.createSelectorQuery();
      query.select('#tempChart').boundingClientRect();
      query.exec(res => {
        console.log('温度图表Canvas元素检查结果:', res);
        if (!res[0]) {
          console.warn('温度图表canvas元素不存在，跳过绘制');
          return;
        }
        
        const hourlyData = this.data.hourlyData;
        console.log('温度图表数据源数量:', hourlyData.length);
        
        // 超级简化：只显示6个时间点
        const simpleData = [];
        for (let i = 0; i < hourlyData.length; i += 4) {
          if (i < hourlyData.length) {
            simpleData.push(hourlyData[i]);
          }
        }
        
        const categories = simpleData.map(item => item.fxTime.substring(11, 16));
        const series = simpleData.map(item => parseInt(item.temp));
        
        console.log('温度图表X轴:', categories);
        console.log('温度图表数据:', series);
        
        // 使用最基本的配置
        try {
          // 准备数据
          const data = {
            categories: categories,
            series: [{
              name: '温度',
              data: series,
              color: '#FF9500'
            }]
          };
          
          // 使用静态方法调用
          wxCharts.drawLineChart('tempChart', data, {
            width: 320,
            height: 200,
            dataLabel: false,
            dataPointShape: false,
            extra: {
              lineStyle: 'straight'
            }
          });
          
          console.log('温度图表绘制命令已发送');
        } catch (err) {
          console.error('绘制温度图表过程中出错:', err);
        }
      });
    } catch (error) {
      console.error('温度图表整体流程出错:', error);
    }
  },
  
  // 绘制湿度图表
  drawHumidityChart: function() {
    try {
      console.log('开始绘制湿度图表');
      if (!this.data.hourlyData) {
        console.error('绘制湿度图表失败: 没有hourlyData数据');
        return;
      }
      
      // 检查canvas元素是否存在
      const query = wx.createSelectorQuery();
      query.select('#humidityChart').boundingClientRect();
      query.exec(res => {
        console.log('湿度图表Canvas元素检查结果:', res);
        if (!res[0]) {
          console.warn('湿度图表canvas元素不存在，跳过绘制');
          return;
        }
        
        const hourlyData = this.data.hourlyData;
        console.log('湿度图表数据源数量:', hourlyData.length);
        
        // 超级简化：只显示6个时间点
        const simpleData = [];
        for (let i = 0; i < hourlyData.length; i += 4) {
          if (i < hourlyData.length) {
            simpleData.push(hourlyData[i]);
          }
        }
        
        const categories = simpleData.map(item => item.fxTime.substring(11, 16));
        const series = simpleData.map(item => parseInt(item.humidity));
        
        console.log('湿度图表X轴:', categories);
        console.log('湿度图表数据:', series);
        
        // 使用最基本的配置
        try {
          // 准备数据
          const data = {
            categories: categories,
            series: [{
              name: '湿度',
              data: series,
              color: '#4A90E2'
            }]
          };
          
          // 使用静态方法调用
          wxCharts.drawLineChart('humidityChart', data, {
            width: 320,
            height: 200,
            dataLabel: false,
            dataPointShape: false,
            extra: {
              lineStyle: 'straight'
            }
          });
          
          console.log('湿度图表绘制命令已发送');
        } catch (err) {
          console.error('绘制湿度图表过程中出错:', err);
        }
      });
    } catch (error) {
      console.error('湿度图表整体流程出错:', error);
    }
  },
  
  // 刷新页面
  refreshData: function() {
    this.getWeatherData();
  },

  // 集中处理图表绘制逻辑
  drawCharts: function() {
    // 设置标记，防止重复渲染
    if (this.data.renderingCharts) return;
    
    this.setData({ renderingCharts: true });
    
    // 增加延迟，确保DOM完全加载和准备就绪
    setTimeout(() => {
      console.log('开始绘制两个图表...');
      this.drawTempChart();
      
      // 分开绘制两个图表，避免冲突
      setTimeout(() => {
        this.drawHumidityChart();
        this.setData({ renderingCharts: false });
      }, 500);
    }, 500);
  }
});
