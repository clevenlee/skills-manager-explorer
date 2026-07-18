<!--
  404 视图：编辑风大字号 + 回到主页 + 跳到上次页，提供明确"下一步"。
  作者：NDP Coding
 * 日期：2026-07-18 10:00:00
-->
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import skillsManagerIconUrl from "../assets/skills-manager-icon.png";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const lastPath = typeof route.query.from === "string" ? route.query.from : "/";
</script>

<template>
  <section class="not-found">
    <img class="brand" :src="skillsManagerIconUrl" alt="" />
    <p class="eyebrow">{{ t("notFound.eyebrow") }}</p>
    <h1>404</h1>
    <p class="lead">{{ t("notFound.lead") }}</p>
    <p class="sub">{{ t("notFound.sub") }}</p>
    <div class="actions">
      <a-button type="primary" size="large" @click="router.push(lastPath)">{{
        t("notFound.backLast")
      }}</a-button>
      <a-button size="large" @click="router.push('/')">{{
        t("notFound.backHome")
      }}</a-button>
    </div>
  </section>
</template>

<style scoped src="../styles/views/not-found.css"></style>
