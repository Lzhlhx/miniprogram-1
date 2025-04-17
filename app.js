// app.js
App({
  onLaunch() {
    // 检查和授权位置权限
    this.checkLocationAuth();
  },
  
  // 检查位置授权
  checkLocationAuth() {
    wx.getSetting({
      success: (res) => {
        const locationAuth = res.authSetting['scope.userLocation'];
        if (locationAuth === false) {
          // 用户曾经拒绝过位置授权，显示提示引导用户授权
          wx.showModal({
            title: '位置授权',
            content: '获取位置信息将用于天气和空气质量查询，请授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (res) => {
                    // 用户在设置页操作后的回调
                    if (res.authSetting['scope.userLocation']) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success'
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  },
  
  // 全局数据
  globalData: {
    userInfo: null,
    // 保存城市信息
    cityInfo: null
  }
})
