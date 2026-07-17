<!--
  Skills Manager Explorer 根组件，将页面渲染交给路由与统一应用布局。
  作者：NDP Coding
  日期：2026-07-17 10:05:00
-->
<template><router-view /></template>

<style>
:root {
  color: #19342d;
  background: #f4f1e8;
  font-family:
    Inter,
    ui-sans-serif,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background:
    radial-gradient(
      circle at 18% 18%,
      rgb(213 232 209 / 70%),
      transparent 28rem
    ),
    #f4f1e8;
}

a {
  color: inherit;
}
</style>
