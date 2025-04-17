/*
 * charts for WeChat small app v1.0
 *
 * 适用于微信小程序的图表工具
 * 简化版本，仅包含线图功能
 */

function drawLineChart(canvasId, data, options) {
  const ctx = wx.createCanvasContext(canvasId);
  const { width, height, padding = 30 } = options;
  
  // 设置画布
  ctx.clearRect(0, 0, width, height);
  
  // 准备数据
  const { categories, series } = data;
  const seriesData = series[0].data;
  
  // 计算坐标轴
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // 找出最大值和最小值
  const max = Math.max(...seriesData) * 1.1;
  const min = Math.min(...seriesData) * 0.9;
  
  // 绘制坐标轴
  ctx.beginPath();
  ctx.setLineWidth(1);
  ctx.setStrokeStyle('#CCCCCC');
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // 绘制X轴标签
  const xStep = chartWidth / (categories.length - 1);
  for (let i = 0; i < categories.length; i++) {
    const x = padding + i * xStep;
    const y = height - padding + 15;
    ctx.setFontSize(10);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText(categories[i], x, y);
  }
  
  // 绘制Y轴标签
  const yStep = chartHeight / 4;
  for (let i = 0; i < 5; i++) {
    const y = height - padding - i * yStep;
    const value = min + (max - min) * (i / 4);
    ctx.setFontSize(10);
    ctx.setTextAlign('right');
    ctx.setTextBaseline('middle');
    ctx.fillText(Math.round(value).toString(), padding - 5, y);
    
    // 绘制网格线
    ctx.setLineWidth(0.5);
    ctx.setStrokeStyle('#EEEEEE');
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // 绘制数据线
  ctx.beginPath();
  ctx.setLineWidth(2);
  ctx.setStrokeStyle(series[0].color || '#4A90E2');
  
  for (let i = 0; i < seriesData.length; i++) {
    const x = padding + i * xStep;
    const y = height - padding - ((seriesData[i] - min) / (max - min)) * chartHeight;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  // 绘制数据点
  for (let i = 0; i < seriesData.length; i++) {
    const x = padding + i * xStep;
    const y = height - padding - ((seriesData[i] - min) / (max - min)) * chartHeight;
    
    ctx.beginPath();
    ctx.setFillStyle('#FFFFFF');
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.setStrokeStyle(series[0].color || '#4A90E2');
    ctx.setLineWidth(1);
    ctx.stroke();
  }
  
  // 绘制标题
  if (options.title) {
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('top');
    ctx.fillText(options.title, width / 2, 10);
  }
  
  ctx.draw();
}

module.exports = {
  drawLineChart
}; 