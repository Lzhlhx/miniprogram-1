// index.js
const api = require('../../utils/api');
const aqiUtil = require('../../utils/aqiUtil');
const wxCharts = require('../../utils/wxCharts');

// 格式化时间函数 - 确保日期格式兼容iOS
const formatTime = (dateStr) => {
  // 检查日期格式并转换为iOS支持的格式
  if (!dateStr) return dateStr;
  
  // 如果包含空格，替换为T（例如 "2025-04-18 01:00+08:00" -> "2025-04-18T01:00+08:00"）
  let formattedDate = dateStr;
  if (formattedDate.includes(' ')) {
    formattedDate = formattedDate.replace(' ', 'T');
  }
  
  // 处理时区格式，确保符合iOS标准 "yyyy-MM-ddTHH:mm:ss.sss+HH:mm"
  if (formattedDate.includes('+')) {
    // 检查是否已经有毫秒部分
    if (!formattedDate.includes('.') && !formattedDate.includes('+08:00.')) {
      // 在时区前添加毫秒
      formattedDate = formattedDate.replace('+08:00', '.000+08:00');
    }
  }
  
  // 如果仍然是非标准格式，尝试使用其他方式解析
  try {
    // 测试日期是否可以被解析
    new Date(formattedDate);
  } catch (e) {
    console.error('日期格式无法解析:', dateStr, '->尝试使用备用格式');
    // 如果还是无法解析，尝试使用更通用的格式
    const parts = dateStr.split(/[\s:T+-]/);
    if (parts.length >= 5) {
      // 尝试构建 yyyy/MM/dd HH:mm:ss 格式
      formattedDate = `${parts[0].replace(/-/g, '/')}/${parts[1]}/${parts[2]} ${parts[3]}:${parts[4]}:00`;
    }
  }
  
  return formattedDate;
};

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
        
        // 修改：显示未来12小时数据
        const now = new Date();
        console.log('当前时间:', now.toLocaleString());
        
        // 将数据按照时间排序（从早到晚）
        const sortedData = [...hourlyData].sort((a, b) => {
          const timeA = new Date(formatTime(a.fxTime));
          const timeB = new Date(formatTime(b.fxTime));
          return timeA - timeB;
        });
        
        // 找到当前时间之后的第一个数据点
        let startIndex = 0;
        
        for (let i = 0; i < sortedData.length; i++) {
          const itemTime = new Date(formatTime(sortedData[i].fxTime));
          if (itemTime >= now) {
            startIndex = i;
            break;
          }
        }
        
        console.log(`找到未来第一个数据点索引: ${startIndex}, 时间: ${sortedData[startIndex].fxTime}`);
        
        // 获取未来12小时的数据点，但只选择6个点（每隔2小时一个点）
        const simpleData = [];
        for (let i = startIndex; i < startIndex + 12 && i < sortedData.length; i += 2) {
          simpleData.push(sortedData[i]);
        }
        
        console.log(`选择了 ${simpleData.length} 个未来数据点`);
        
        // 如果未来数据不足6点，补充更远的未来数据（循环使用现有数据）
        if (simpleData.length < 6) {
          console.log('警告：未来数据不足6点，将循环使用已有数据');
          const neededPoints = 6 - simpleData.length;
          console.log(`需要补充 ${neededPoints} 个数据点`);
          
          // 循环使用已有数据填充
          for (let i = 0; i < neededPoints; i++) {
            const indexToUse = (i * 2) % sortedData.length; // 保持2小时间隔
            simpleData.push({
              ...sortedData[indexToUse],
              fxTime: `预测+${(i+simpleData.length)*2}h`  // 标记为预测数据，保持2小时间隔
            });
          }
          
          console.log(`补充后总共有 ${simpleData.length} 个数据点`);
        }
        
        // 确保严格只有6个点
        if (simpleData.length > 6) {
          console.log(`警告：数据点过多(${simpleData.length})，将截取前6个点`);
          simpleData.splice(6); // 只保留前6个点
        }
        
        // 打印最终选择的数据点
        console.log('最终选择的数据点:');
        simpleData.forEach((item, index) => {
          console.log(`[${index}] ${item.fxTime}`);
        });
        
        // 为图表准备数据
        let categories = [];
        let series = [];
        
        if (simpleData[0].fxTime.startsWith('预测')) {
          // 处理预测数据情况
          categories = simpleData.map((item, index) => `+${index+1}h`);
          series = simpleData.map(item => parseInt(item.temp));
        } else {
          // 处理正常情况
          categories = simpleData.map(item => item.fxTime.substring(11, 16));
          series = simpleData.map(item => parseInt(item.temp));
        }
        
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
            width: 340, // 增加宽度以容纳更多数据点
            height: 200,
            dataLabel: true, // 显示数据点的标签
            dataPointShape: true, // 显示数据点的形状
            yAxis: {
              title: '温度(°C)',
              format: function(val) {
                return val.toFixed(0) + '°C';
              },
              min: 0,
              fontColor: '#666666',
              titleFontColor: '#333333',
              titleFontSize: 12
            },
            xAxis: {
              fontColor: '#666666',
              disableGrid: false
            },
            extra: {
              lineStyle: 'curve',
              column: {
                width: 20 // 调整柱宽
              }
            },
            boundaryGap: 'center', // 调整边界距离
            showX: true, // 显示所有X轴标签
            animation: true
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
        
        // 修改：显示未来12小时数据
        const now = new Date();
        
        // 将数据按照时间排序（从早到晚）
        const sortedData = [...hourlyData].sort((a, b) => {
          const timeA = new Date(formatTime(a.fxTime));
          const timeB = new Date(formatTime(b.fxTime));
          return timeA - timeB;
        });
        
        // 找到当前时间之后的第一个数据点
        let startIndex = 0;
        
        for (let i = 0; i < sortedData.length; i++) {
          const itemTime = new Date(formatTime(sortedData[i].fxTime));
          if (itemTime >= now) {
            startIndex = i;
            break;
          }
        }
        
        // 获取未来12小时的数据点，但只选择6个点（每隔2小时一个点）
        const simpleData = [];
        for (let i = startIndex; i < startIndex + 12 && i < sortedData.length; i += 2) {
          simpleData.push(sortedData[i]);
        }
        
        console.log(`选择了 ${simpleData.length} 个未来数据点`);
        
        // 如果未来数据不足6点，补充更远的未来数据（循环使用现有数据）
        if (simpleData.length < 6) {
          console.log('警告：未来数据不足6点，将循环使用已有数据');
          const neededPoints = 6 - simpleData.length;
          
          // 循环使用已有数据填充
          for (let i = 0; i < neededPoints; i++) {
            const indexToUse = (i * 2) % sortedData.length; // 保持2小时间隔
            simpleData.push({
              ...sortedData[indexToUse],
              fxTime: `预测+${(i+simpleData.length)*2}h`  // 标记为预测数据，保持2小时间隔
            });
          }
        }
        
        // 确保严格只有6个点
        if (simpleData.length > 6) {
          console.log(`警告：数据点过多(${simpleData.length})，将截取前6个点`);
          simpleData.splice(6); // 只保留前6个点
        }
        
        // 为图表准备数据
        let categories = [];
        let series = [];
        
        if (simpleData[0].fxTime.startsWith('预测')) {
          // 处理预测数据情况
          categories = simpleData.map((item, index) => `+${index+1}h`);
          series = simpleData.map(item => parseInt(item.humidity));
        } else {
          // 处理正常情况
          categories = simpleData.map(item => item.fxTime.substring(11, 16));
          series = simpleData.map(item => parseInt(item.humidity));
        }
        
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
            width: 340, // 增加宽度以容纳更多数据点
            height: 200,
            dataLabel: true, // 显示数据点的标签
            dataPointShape: true, // 显示数据点的形状
            yAxis: {
              title: '湿度(%)',
              format: function(val) {
                return val.toFixed(0) + '%';
              },
              min: 0,
              max: 100,
              fontColor: '#666666',
              titleFontColor: '#333333',
              titleFontSize: 12
            },
            xAxis: {
              fontColor: '#666666',
              disableGrid: false
            },
            extra: {
              lineStyle: 'curve',
              column: {
                width: 20 // 调整柱宽
              }
            },
            boundaryGap: 'center', // 调整边界距离
            showX: true, // 显示所有X轴标签
            animation: true
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
