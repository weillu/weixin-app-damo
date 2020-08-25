/**
 * Storage通用存储文件定义
 */
const STORAGE_KEY = 'damo';
module.exports = {
  // 设置值
  setItem(key,value,module_name){
    if (module_name){
      let module_name_info = this.getItem(module_name);
      module_name_info[key] = value;
      wx.setStorageSync(module_name, module_name_info)
    }else{
      wx.setStorageSync(key, value)
    }
  },
  // 获取值
  getItem(key, module_name){
    if (module_name){
      let val = this.getItem(module_name);
      if(val)return val[key];
      return '';
    }else{
      return wx.getStorageSync(key);
    }
  },
  // 删除或者清空值
  clear(key){
    key?wx.removeStorageSync(key):wx.clearStorageSync();
  },
  getSystemInfo(){
    return wx.getSystemInfoSync();
  }
}