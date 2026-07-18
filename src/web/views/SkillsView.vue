<!--
  Skill 清单页面，把搜索、来源、场景、孤立状态、排序和分页完整保存在 URL。
  1.0.3 起支持多选 + 批量添加到场景，每行场景归属列可“编辑”。
  作者：NDP Coding
  日期：2026-07-17 12:50:00
-->
<script setup lang="ts">
import { message } from "ant-design-vue";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import type { Workspace } from "@/shared/contracts/catalog";

import type {
  Scenario,
  SkillSummary,
  Source,
} from "@/shared/contracts/catalog";
import { allCatalogApi, catalogApi } from "../api/catalog-api";
import { useLocale } from "../composables/useLocale";
import RequestState from "../components/RequestState.vue";

const { t, locale } = useI18n();
const { formatNumber } = useLocale();
const route = useRoute();
const router = useRouter();
const items = ref<SkillSummary[]>([]);
const sources = ref<Source[]>([]);
const scenarios = ref<Scenario[]>([]);
const allWorkspaces = ref<Workspace[]>([]);
// 仅展示有启用资源的工作区（enabledSkillCount > 0 或 enabledScenarioCount > 0）。
// 用户在前端下拉里看到的应当是"实际在用"的工作区，而不是知识库里所有被配置的工具。
const enabledWorkspaces = computed(() =>
  allWorkspaces.value.filter(
    (ws) => ws.enabledSkillCount > 0 || ws.enabledScenarioCount > 0,
  ),
);
const total = ref(0);
const loading = ref(true);
const error = ref("");
const q = ref(String(route.query.q || ""));
const sourceIds = ref(
  String(route.query.sourceIds || "")
    .split(",")
    .filter(Boolean),
);
const scenarioIds = ref(
  String(route.query.scenarioIds || "")
    .split(",")
    .filter(Boolean),
);
const workspaces = ref(
  String(route.query.workspaces || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
const orphan = ref(route.query.orphan === "true");
const multiScenario = ref(route.query.multiScenario === "true");
const sort = ref(String(route.query.sort || "name"));
const order = ref(String(route.query.order || "asc"));
const page = ref(Number(route.query.page || 1));
const pageSize = ref(
  [20, 50].includes(Number(route.query.pageSize))
    ? Number(route.query.pageSize)
    : 0,
);
const viewMode = ref<"grid" | "table">(
  route.query.view === "table" ? "table" : "grid",
);

// 1.0.3: 多选 + 行内编辑状态
const selected = ref<Set<string>>(new Set());
const bulkModalOpen = ref(false);
const bulkSubmitting = ref(false);
const bulkPickedScenarios = ref<string[]>([]);
const editModalSkill = ref<SkillSummary | null>(null);
const editModalScenarios = ref<string[]>([]);
const editModalOriginal = ref<string[]>([]);
const editModalLoading = ref(false);
const editModalSaving = ref(false);

const selectedCount = computed(() => selected.value.size);
const allOnPageSelected = computed(() => {
  if (items.value.length === 0) return false;
  return items.value.every((item) => selected.value.has(item.id));
});

function queryValues() {
  return {
    q: q.value || undefined,
    sourceIds: sourceIds.value.join(",") || undefined,
    scenarioIds: scenarioIds.value.join(",") || undefined,
    workspaces: workspaces.value.join(",") || undefined,
    orphan: orphan.value ? "true" : undefined,
    multiScenario: multiScenario.value ? "true" : undefined,
    sort: sort.value === "name" ? undefined : sort.value,
    order: order.value === "asc" ? undefined : order.value,
    page: page.value === 1 ? undefined : String(page.value),
    pageSize: pageSize.value === 0 ? undefined : String(pageSize.value),
    view: viewMode.value === "grid" ? undefined : viewMode.value,
  };
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [response, sourceResponse, scenarioResponse, workspacesRes] =
      await Promise.all([
        catalogApi.skills(queryValues()),
        allCatalogApi.sources(),
        allCatalogApi.scenarios(),
        catalogApi.workspaces(),
      ]);
    items.value = response.data;
    total.value = response.meta.total;
    sources.value = sourceResponse;
    scenarios.value = scenarioResponse;
    allWorkspaces.value = workspacesRes.data;
    // 清理已不在列表中的选择
    const ids = new Set(response.data.map((s) => s.id));
    for (const id of [...selected.value])
      if (!ids.has(id)) selected.value.delete(id);
  } catch (reason) {
    error.value =
      reason instanceof Error ? reason.message : t("skills.errorFallback");
  } finally {
    loading.value = false;
  }
}
async function apply() {
  page.value = 1;
  await router.replace({ query: queryValues() });
  await load();
}
async function changePage(next: number) {
  page.value = next;
  await router.replace({ query: queryValues() });
  await load();
}
async function changePageSize(next: number | string) {
  pageSize.value = Number(next);
  await apply();
}
async function changeOrphan(): Promise<void> {
  if (orphan.value) multiScenario.value = false;
  await apply();
}
async function changeMultiScenario(): Promise<void> {
  if (multiScenario.value) orphan.value = false;
  await apply();
}
async function syncRoute(): Promise<void> {
  await router.replace({ query: queryValues() });
}
function formatTime(value: number | null): string {
  if (!value) return t("common.placeholder");
  return new Intl.DateTimeFormat(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
async function clear() {
  q.value = "";
  sourceIds.value = [];
  scenarioIds.value = [];
  workspaces.value = [];
  orphan.value = false;
  multiScenario.value = false;
  sort.value = "name";
  order.value = "asc";
  await apply();
}
function toggleOne(id: string, checked: boolean) {
  if (checked) selected.value.add(id);
  else selected.value.delete(id);
  // 触发响应式更新
  selected.value = new Set(selected.value);
}
function toggleAll(checked: boolean) {
  if (checked) {
    for (const item of items.value) selected.value.add(item.id);
  } else {
    for (const item of items.value) selected.value.delete(item.id);
  }
  selected.value = new Set(selected.value);
}
function clearSelection() {
  selected.value = new Set();
}
function openBulkAdd() {
  if (selectedCount.value === 0) {
    void message.warning(t("skills.selection.selectAtLeastOne"));
    return;
  }
  bulkPickedScenarios.value = [];
  bulkModalOpen.value = true;
}
async function confirmBulkAdd() {
  if (bulkPickedScenarios.value.length === 0) {
    void message.warning(t("skills.selection.selectAtLeastOneScenario"));
    return;
  }
  bulkSubmitting.value = true;
  try {
    const result = await catalogApi.bulkAddScenarios({
      skillIds: [...selected.value],
      scenarioIds: bulkPickedScenarios.value,
    });
    const { results, skipped } = result.data;
    if (results.length === 0 && skipped.length > 0) {
      void message.info(
        t("skills.selection.bulkPartial", {
          updated: 0,
          skipped: skipped.length,
        }),
      );
    } else if (skipped.length === 0) {
      void message.success(
        t("skills.selection.bulkSuccess", { updated: results.length }),
      );
    } else {
      void message.success(
        t("skills.selection.bulkPartial", {
          updated: results.length,
          skipped: skipped.length,
        }),
      );
    }
    bulkModalOpen.value = false;
    await load();
  } catch (reason) {
    void message.error(
      t("skills.selection.bulkError", {
        message: reason instanceof Error ? reason.message : String(reason),
      }),
    );
  } finally {
    bulkSubmitting.value = false;
  }
}
function openEdit(skill: SkillSummary): void {
  editModalSkill.value = skill;
  editModalScenarios.value = skill.scenarios.map((s) => s.id);
  editModalOriginal.value = [...editModalScenarios.value];
  editModalLoading.value = false;
}
async function saveEdit() {
  if (!editModalSkill.value) return;
  if (
    editModalScenarios.value.length === editModalOriginal.value.length &&
    editModalScenarios.value.every((id, i) => id === editModalOriginal.value[i])
  ) {
    editModalSkill.value = null;
    return;
  }
  editModalSaving.value = true;
  try {
    await catalogApi.assign(editModalSkill.value.id, {
      scenarioIds: editModalScenarios.value,
      expectedScenarioIds: editModalOriginal.value,
    });
    void message.success(t("skillDetail.message.saved"));
    editModalSkill.value = null;
    await load();
  } catch (reason) {
    void message.error(
      reason instanceof Error
        ? reason.message
        : t("skillDetail.message.saveFailed"),
    );
  } finally {
    editModalSaving.value = false;
  }
}
function cancelEdit() {
  editModalSkill.value = null;
}

onMounted(load);
watch(scenarioIds, () => void load());
</script>

<template>
  <section class="page">
    <p class="eyebrow">{{ t("skills.eyebrow") }}</p>
    <div class="title-row">
      <div>
        <h1>{{ t("skills.title") }}</h1>
        <p class="lead">
          {{ t("skills.lead", { count: formatNumber(total) }) }}
        </p>
      </div>
      <a-button
        v-if="
          q ||
          sourceIds.length ||
          scenarioIds.length ||
          workspaces.length ||
          orphan ||
          multiScenario
        "
        @click="clear"
        >{{ t("common.clear") }}</a-button
      >
    </div>
    <div class="filters">
      <a-input-search
        v-model:value="q"
        class="skill-search"
        allow-clear
        :placeholder="t('skills.searchPlaceholder')"
        @search="apply"
      /><a-select
        v-model:value="sourceIds"
        class="filter-multi"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        :placeholder="t('skills.filters.sources')"
        @change="apply"
        ><a-select-option
          v-for="source in sources"
          :key="source.id"
          :value="source.id"
          >{{ source.name }}</a-select-option
        ></a-select
      ><a-select
        v-model:value="scenarioIds"
        class="filter-multi"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        :placeholder="t('skills.filters.scenarios')"
        @change="apply"
        ><a-select-option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
          >{{ scenario.name }}</a-select-option
        ></a-select
      ><a-select
        v-model:value="workspaces"
        class="filter-multi"
        mode="multiple"
        allow-clear
        max-tag-count="responsive"
        :placeholder="t('workspaces.title')"
        data-testid="skills-workspace-filter"
        @change="apply"
        ><a-select-option
          v-for="ws in enabledWorkspaces"
          :key="ws.name"
          :value="ws.name"
          >{{ ws.name }}</a-select-option
        ></a-select
      ><a-select
        v-model:value="sort"
        class="filter-sort"
        :aria-label="t('skills.sortAria')"
        @change="apply"
        ><a-select-option value="name">{{
          t("skills.sortOptions.name")
        }}</a-select-option
        ><a-select-option value="createdAt">{{
          t("skills.sortOptions.createdAt")
        }}</a-select-option
        ><a-select-option value="updatedAt">{{
          t("skills.sortOptions.updatedAt")
        }}</a-select-option
        ><a-select-option value="status">{{
          t("skills.sortOptions.status")
        }}</a-select-option></a-select
      ><a-select
        v-model:value="order"
        class="filter-order"
        :aria-label="t('skills.orderAria')"
        @change="apply"
        ><a-select-option value="asc">{{
          t("skills.orderOptions.asc")
        }}</a-select-option
        ><a-select-option value="desc">{{
          t("skills.orderOptions.desc")
        }}</a-select-option></a-select
      ><a-checkbox v-model:checked="orphan" @change="changeOrphan">{{
        t("skills.checkboxes.orphanOnly")
      }}</a-checkbox
      ><a-checkbox
        v-model:checked="multiScenario"
        @change="changeMultiScenario"
        >{{ t("skills.checkboxes.multiScenarioOnly") }}</a-checkbox
      >
    </div>
    <div class="list-controls">
      <a-radio-group
        v-model:value="viewMode"
        :aria-label="t('skills.view.aria')"
        @change="syncRoute"
      >
        <a-radio-button value="grid">{{
          t("skills.view.grid")
        }}</a-radio-button>
        <a-radio-button value="table">{{
          t("skills.view.table")
        }}</a-radio-button>
      </a-radio-group>
      <label class="page-size-control"
        >{{ t("skills.pageSize.label") }}
        <a-select
          v-model:value="pageSize"
          :aria-label="t('skills.pageSize.aria')"
          @change="changePageSize"
          ><a-select-option :value="0">{{
            t("skills.pageSize.all")
          }}</a-select-option
          ><a-select-option :value="20">{{
            t("skills.pageSize.20")
          }}</a-select-option
          ><a-select-option :value="50">{{
            t("skills.pageSize.50")
          }}</a-select-option></a-select
        >
      </label>
    </div>

    <!-- 1.0.3 多选 / 批量操作工具条 -->
    <div
      v-if="selectedCount > 0"
      class="selection-bar"
      role="region"
      aria-live="polite"
    >
      <span>{{
        t("skills.selection.selectedCount", { count: selectedCount })
      }}</span>
      <a-button size="small" @click="clearSelection">{{
        t("skills.selection.clearSelection")
      }}</a-button>
      <a-button type="primary" size="small" @click="openBulkAdd">{{
        t("skills.selection.addToScenarios")
      }}</a-button>
    </div>

    <request-state
      :loading="loading"
      :error="error"
      :empty="items.length === 0"
      :empty-text="t('skills.emptyText')"
      @retry="load"
    >
      <div v-if="viewMode === 'grid'" class="skill-grid">
        <article
          v-for="skill in items"
          :key="skill.id"
          class="skill-card"
          :class="{ 'skill-card-selected': selected.has(skill.id) }"
        >
          <div class="skill-card-top">
            <a-checkbox
              :checked="selected.has(skill.id)"
              :aria-label="skill.name"
              @change="
                (e: { target: { checked: boolean } }) =>
                  toggleOne(skill.id, e.target.checked)
              "
            />
            <a-tag :color="skill.enabled ? 'green' : 'default'">{{
              skill.enabled
                ? t("skills.status.enabled")
                : t("skills.status.disabled")
            }}</a-tag>
            <span class="skill-source-name">{{
              skill.source?.name || t("common.unknownSource")
            }}</span>
          </div>
          <router-link
            class="skill-detail-link"
            :to="{
              name: 'skill-detail',
              params: { skillId: skill.id },
              query: { from: route.fullPath },
            }"
          >
            <h2>{{ skill.name }}</h2>
          </router-link>
          <p>{{ skill.description || t("common.noDescription") }}</p>
          <small class="skill-created-at"
            >{{ t("common.createdAtPrefix") }}
            {{ formatTime(skill.createdAt) }}</small
          >
          <div class="scenario-tags">
            <a-tag v-for="scenario in skill.scenarios" :key="scenario.id">{{
              scenario.name
            }}</a-tag
            ><span v-if="skill.scenarios.length === 0" class="orphan">{{
              t("skills.orphanBadge")
            }}</span>
          </div>
          <a-button
            class="edit-button"
            type="link"
            size="small"
            :aria-label="t('skills.edit.aria')"
            @click="openEdit(skill)"
            >{{ t("skills.edit.aria") }}</a-button
          >
        </article>
      </div>
      <div v-else class="skill-table-wrap">
        <table class="skill-table" :aria-label="t('skills.title')">
          <thead>
            <tr>
              <th scope="col" class="col-select">
                <a-checkbox
                  :checked="allOnPageSelected"
                  :indeterminate="!allOnPageSelected && selectedCount > 0"
                  :aria-label="t('skills.selection.selectAll')"
                  @change="
                    (e: { target: { checked: boolean } }) =>
                      toggleAll(e.target.checked)
                  "
                />
              </th>
              <th scope="col">{{ t("skills.tableHeaders.skill") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.source") }}</th>
              <th scope="col" class="col-scenarios">
                {{ t("skills.tableHeaders.scenarios") }}
              </th>
              <th scope="col">{{ t("skills.tableHeaders.status") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.createdAt") }}</th>
              <th scope="col">{{ t("skills.tableHeaders.updatedAt") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="skill in items"
              :key="skill.id"
              :class="{ 'skill-row-selected': selected.has(skill.id) }"
            >
              <td class="col-select">
                <a-checkbox
                  :checked="selected.has(skill.id)"
                  :aria-label="skill.name"
                  @change="
                    (e: { target: { checked: boolean } }) =>
                      toggleOne(skill.id, e.target.checked)
                  "
                />
              </td>
              <td>
                <router-link
                  :to="{
                    name: 'skill-detail',
                    params: { skillId: skill.id },
                    query: { from: route.fullPath },
                  }"
                  class="skill-name"
                  >{{ skill.name }}</router-link
                >
                <p>{{ skill.description || t("common.noDescription") }}</p>
              </td>
              <td>{{ skill.source?.name || t("common.unknownSource") }}</td>
              <td class="col-scenarios">
                <div class="scenarios-cell">
                  <div class="scenario-tags table-scenarios">
                    <a-tag
                      v-for="scenario in skill.scenarios"
                      :key="scenario.id"
                      >{{ scenario.name }}</a-tag
                    >
                    <span v-if="skill.scenarios.length === 0" class="orphan">{{
                      t("skills.orphanBadge")
                    }}</span>
                  </div>
                  <a-button
                    type="link"
                    size="small"
                    class="edit-link"
                    :aria-label="t('skills.edit.aria')"
                    @click="openEdit(skill)"
                    >{{ t("skills.edit.aria") }}</a-button
                  >
                </div>
              </td>
              <td>
                <a-tag :color="skill.enabled ? 'green' : 'default'">{{
                  skill.enabled
                    ? t("skills.status.enabled")
                    : t("skills.status.disabled")
                }}</a-tag>
              </td>
              <td>{{ formatTime(skill.createdAt) }}</td>
              <td>{{ formatTime(skill.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <a-pagination
        v-if="pageSize > 0 && total > pageSize"
        :current="page"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="changePage"
      />
    </request-state>

    <!-- 批量添加到场景：仅追加 -->
    <a-modal
      v-model:open="bulkModalOpen"
      :title="t('skills.selection.addToScenarios')"
      :width="620"
      :ok-text="t('common.save')"
      :cancel-text="t('common.cancel')"
      :confirm-loading="bulkSubmitting"
      @ok="confirmBulkAdd"
    >
      <p class="modal-hint">{{ t("skills.edit.selectPrompt") }}</p>
      <a-checkbox-group
        v-model:value="bulkPickedScenarios"
        class="scenario-checkbox-grid"
        :aria-label="t('skills.filters.scenarios')"
      >
        <a-checkbox
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
          class="scenario-checkbox-option"
          >{{ scenario.name }}</a-checkbox
        >
      </a-checkbox-group>
    </a-modal>

    <!-- 单条编辑场景归属：替换语义 -->
    <a-modal
      :open="editModalSkill !== null"
      :title="
        editModalSkill
          ? t('skills.edit.modalTitle', { name: editModalSkill.name })
          : ''
      "
      :ok-text="t('skills.edit.save')"
      :cancel-text="t('skills.edit.cancel')"
      :confirm-loading="editModalSaving"
      @ok="saveEdit"
      @cancel="cancelEdit"
    >
      <p class="modal-hint">{{ t("skills.edit.replaceHelp") }}</p>
      <a-select
        v-model:value="editModalScenarios"
        mode="multiple"
        allow-clear
        :placeholder="t('skillDetail.assignment.placeholder')"
      >
        <a-select-option
          v-for="scenario in scenarios"
          :key="scenario.id"
          :value="scenario.id"
          >{{ scenario.name }}</a-select-option
        >
      </a-select>
    </a-modal>
  </section>
</template>

<style scoped src="../styles/views/skills.css"></style>
