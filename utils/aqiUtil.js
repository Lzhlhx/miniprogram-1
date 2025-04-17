/**
 * 根据AQI指数返回空气质量等级和颜色
 * @param {Number} aqi 空气质量指数
 * @returns {Object} 包含等级、颜色和建议的对象
 */
const getAQIInfo = (aqi) => {
  let level = '';
  let color = '';
  let suggestion = '';

  if (aqi <= 50) {
    level = '优';
    color = '#00e400';
    suggestion = '空气质量令人满意，基本无空气污染，各类人群可正常活动。';
  } else if (aqi <= 100) {
    level = '良';
    color = '#ffff00';
    suggestion = '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响。';
  } else if (aqi <= 150) {
    level = '轻度污染';
    color = '#ff7e00';
    suggestion = '易感人群症状有轻度加剧，健康人群可能出现刺激症状。建议儿童、老年人及心脏病、呼吸系统疾病患者应减少长时间、高强度的户外锻炼。';
  } else if (aqi <= 200) {
    level = '中度污染';
    color = '#ff0000';
    suggestion = '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响。建议疾病患者避免长时间、高强度的户外锻练，一般人群适量减少户外运动。';
  } else if (aqi <= 300) {
    level = '重度污染';
    color = '#99004c';
    suggestion = '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状。建议儿童、老年人和心脏病、肺病患者应停留在室内，停止户外运动，一般人群减少户外运动。';
  } else {
    level = '严重污染';
    color = '#7e0023';
    suggestion = '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病。建议儿童、老年人和病人应当留在室内，避免体力消耗，一般人群应避免户外活动。';
  }

  return {
    level,
    color,
    suggestion
  };
};

/**
 * 获取空气质量主要污染物的中文名称
 * @param {String} primary 主要污染物代码
 * @returns {String} 污染物中文名称
 */
const getPrimaryPollutant = (primary) => {
  const pollutants = {
    'pm2.5': 'PM2.5细颗粒物',
    'pm10': 'PM10可吸入颗粒物',
    'o3': '臭氧',
    'no2': '二氧化氮',
    'so2': '二氧化硫',
    'co': '一氧化碳'
  };
  
  return pollutants[primary] || '暂无';
};

module.exports = {
  getAQIInfo,
  getPrimaryPollutant
}; 