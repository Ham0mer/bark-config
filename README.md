# Bark 推送配置生成器

一个简洁优雅的 Bark 推送配置工具,支持多种输出格式。

## ✨ 特性

- 🎨 现代化界面设计,支持移动端
- 📝 可视化配置所有 Bark 参数
- 🔄 支持 GET URL、JSON、PHP、cURL 格式
- 💾 本地保存和管理配置
- 🧪 一键测试推送

## 🚀 使用

1. 用浏览器打开 `index.html`
2. 填写 Device Key (从 Bark APP 获取)
3. 配置推送参数并生成

## 📖 主要参数

| 参数 | 说明 |
|------|------|
| title | 推送标题 |
| body | 推送内容(必填) |
| level | 推送级别: active/timeSensitive/passive/critical |
| sound | 铃声名称 |
| badge | 角标数字 |
| group | 通知分组 |
| icon | 自定义图标 URL |
| url | 点击跳转 URL |

## 🎯 示例

### GET URL
```
https://api.day.app/your_key/标题/内容?sound=minuet
```

### JSON
```json
{
  "device_key": "your_key",
  "title": "标题",
  "body": "内容",
  "sound": "minuet"
}
```

### PHP
```php
$array = array(
    'title'=>'标题',
    'body'=>'内容',
    'sound'=>'minuet'
);
```

## 🔗 链接

- [Bark 官网](https://bark.day.app)
- [Bark GitHub](https://github.com/Finb/Bark)
- [APP Store](https://apps.apple.com/cn/app/bark-customed-notifications/id1403753865)

##  许可

MIT License
