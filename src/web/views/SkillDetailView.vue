<!--
  Skill 详情页面，完整展示可复制字段，并以二次确认安全调整单个 Skill 的场景归属。
  字段标签、状态、确认弹窗、消息反馈经 useI18n() 国际化。
  作者：NDP Coding
  日期：2026-07-17 12:50:00
-->
<script setup lang="ts">
import { Modal, message } from "ant-design-vue";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import type { Scenario, SkillDetail } from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import RequestState from "../components/RequestState.vue";

const { t, locale } = useI18n();
const route = useRoute();
const skill = ref<SkillDetail>();
const scenarios = ref<Scenario[]>([]);
const selected = ref<string[]>([]);
const original = ref<string[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const skillId = computed(() => String(route.params.skillId));
const backTo = computed(() =>
  typeof route.query.from === "string" && route.query.from.startsWith("/")
    ? route.query.from
    : "/skills",
);
const normalizedSelected = computed(() => [...selected.value].sort());
const changed = computed(
  () =>
    normalizedSelected.value.join("|") !== [...original.value].sort().join("|"),
);
const added = computed(() =>
  selected.value
    .filter((id) => !original.value.includes(id))
    .map((id) => scenarios.value.find((item) => item.id === id)?.name || id),
);
const removed = computed(() =>
  original.value
    .filter((id) => !selected.value.includes(id))
    .map((id) => scenarios.value.find((item) => item.id === id)?.name || id),
);
const fields = computed(() =>
  skill.value
    ? [
        [t("skillDetail.fields.ID"), skill.value.id],
        [t("skillDetail.fields.description"), skill.value.description],
        [t("skillDetail.fields.sourceType"), skill.value.sourceType],
        [t("skillDetail.fields.sourceRef"), skill.value.sourceRef],
        [
          t("skillDetail.fields.sourceRefResolved"),
          skill.value.sourceRefResolved,
        ],
        [t("skillDetail.fields.sourceSubpath"), skill.value.sourceSubpath],
        [t("skillDetail.fields.sourceBranch"), skill.value.sourceBranch],
        [t("skillDetail.fields.sourceRevision"), skill.value.sourceRevision],
        [t("skillDetail.fields.remoteRevision"), skill.value.remoteRevision],
        [t("skillDetail.fields.centralPath"), skill.value.centralPath],
        [t("skillDetail.fields.contentHash"), skill.value.contentHash],
        [t("skillDetail.fields.status"), skill.value.status],
        [t("skillDetail.fields.updateStatus"), skill.value.updateStatus],
        [t("skillDetail.fields.createdAt"), formatTime(skill.value.createdAt)],
        [t("skillDetail.fields.updatedAt"), formatTime(skill.value.updatedAt)],
        [
          t("skillDetail.fields.lastCheckedAt"),
          formatTime(skill.value.lastCheckedAt),
        ],
        [t("skillDetail.fields.lastCheckError"), skill.value.lastCheckError],
      ]
    : [],
);
function formatTime(value: number | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
async function copy(value: string) {
  await navigator.clipboard.writeText(value);
  void message.success(t("common.copySuccess"));
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [detail, allScenarios] = await Promise.all([
      catalogApi.skill(skillId.value),
      allCatalogApi.scenarios(),
    ]);
    skill.value = detail.data;
    scenarios.value = allScenarios;
    original.value = detail.data.scenarios.map((item) => item.id);
    selected.value = [...original.value];
  } catch (reason) {
    error.value =
      reason instanceof Error
        ? reason.message
        : t("skillDetail.message.errorFallback");
  } finally {
    loading.value = false;
  }
}
function confirmSave() {
  if (!changed.value) return;
  Modal.confirm({
    title: t("skillDetail.modal.title"),
    content: t("skillDetail.modal.content", {
      added: added.value.join("、") || t("skillDetail.modal.none"),
      removed: removed.value.join("、") || t("skillDetail.modal.none"),
    }),
    okText: t("skillDetail.modal.save"),
    cancelText: t("skillDetail.modal.cancel"),
    async onOk() {
      saving.value = true;
      try {
        await catalogApi.assign(skillId.value, {
          scenarioIds: selected.value,
          expectedScenarioIds: original.value,
        });
        void message.success(t("skillDetail.message.saved"));
        await load();
      } catch (reason) {
        void message.error(
          reason instanceof Error
            ? reason.message
            : t("skillDetail.message.saveFailed"),
        );
      } finally {
        saving.value = false;
      }
    },
  });
}
onMounted(load);
</script>

<template>
  <section class="page">
    <router-link class="back" :to="backTo">{{
      t("common.backToList")
    }}</router-link
    ><request-state :loading="loading" :error="error" @retry="load">
      <template v-if="skill"
        ><p class="eyebrow">{{ t("skillDetail.eyebrow") }}</p>
        <div class="title-row">
          <div>
            <h1>{{ skill.name }}</h1>
            <p>{{ skill.description || t("common.noDescription") }}</p>
          </div>
          <a-tag :color="skill.enabled ? 'green' : 'default'">{{
            skill.enabled ? t("skillDetail.enabled") : t("skillDetail.disabled")
          }}</a-tag>
        </div>
        <section class="assignment">
          <div>
            <h2>{{ t("skillDetail.assignment.title") }}</h2>
            <p>{{ t("skillDetail.assignment.description") }}</p>
          </div>
          <a-select
            v-model:value="selected"
            mode="multiple"
            class="scenario-select"
            :placeholder="t('skillDetail.assignment.placeholder')"
            ><a-select-option
              v-for="scenario in scenarios"
              :key="scenario.id"
              :value="scenario.id"
              >{{ scenario.name }}</a-select-option
            ></a-select
          ><a-button
            type="primary"
            :disabled="!changed"
            :loading="saving"
            @click="confirmSave"
            >{{ t("skillDetail.assignment.save") }}</a-button
          >
        </section>
        <dl class="fields">
          <div v-for="field in fields" :key="field[0]">
            <dt>{{ field[0] }}</dt>
            <dd>
              <span>{{ field[1] || t("common.placeholder") }}</span
              ><a-button
                v-if="field[1]"
                type="link"
                size="small"
                @click="copy(String(field[1]))"
                >{{ t("common.copy") }}</a-button
              >
            </dd>
          </div>
        </dl>
      </template>
    </request-state>
  </section>
</template>

<style scoped>
.page {
  max-width: 1000px;
}
.back {
  display: inline-block;
  margin-bottom: 30px;
  color: #58736a;
}
.eyebrow {
  margin: 0 0 10px;
  color: #648078;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.title-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
}
.title-row h1 {
  margin: 0;
  font-family: Georgia, "Songti SC", serif;
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 600;
  letter-spacing: -0.05em;
}
.title-row p {
  max-width: 680px;
  color: #657871;
  font-size: 17px;
  line-height: 1.7;
}
.assignment {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 1.5fr) auto;
  gap: 18px;
  align-items: center;
  margin: 40px 0 24px;
  padding: 24px;
  border-radius: 20px;
  color: #fff;
  background: #245c4c;
}
.assignment h2,
.assignment p {
  margin: 0;
}
.assignment p {
  margin-top: 5px;
  color: #d5e6df;
  font-size: 12px;
}
.scenario-select {
  width: 100%;
}
.fields {
  margin: 0;
  border: 1px solid rgb(25 52 45 / 13%);
  border-radius: 20px;
  background: #fffdf7;
}
.fields > div {
  display: grid;
  grid-template-columns: 170px 1fr;
  border-bottom: 1px solid rgb(25 52 45 / 10%);
}
.fields > div:last-child {
  border-bottom: 0;
}
.fields dt {
  padding: 18px 20px;
  color: #6d7f79;
  font-size: 13px;
}
.fields dd {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 18px 20px;
  border-left: 1px solid rgb(25 52 45 / 10%);
  font-family: ui-monospace, monospace;
  overflow-wrap: anywhere;
}
@media (max-width: 720px) {
  .assignment {
    grid-template-columns: 1fr;
  }
  .fields > div {
    grid-template-columns: 1fr;
  }
  .fields dt {
    padding-bottom: 4px;
  }
  .fields dd {
    padding-top: 4px;
    border-left: 0;
  }
  .title-row {
    flex-direction: column;
  }
}
</style>
