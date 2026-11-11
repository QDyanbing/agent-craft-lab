import { getLocaleValue } from '@/i18n';
import { onHistoryChange } from '@/utils/history';
import { showTotal } from '@/utils/pagination';
import type { TableColumnsType, TableRef } from 'antd';
import { Button, Empty, Flex, Grid, Pagination, Popconfirm, Spin, Table, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionnaireForm from './components/QuestionnaireForm';
import SearchBar from './components/SearchBar';
import useCreate from './hooks/useCreate';
import useDelete from './hooks/useDelete';
import useModify from './hooks/useModify';
import styles from './index.module.less';
import useData from './models/useData';
import useDataSet from './models/useDataSet';
import usePage from './models/usePage';

const ACTION_COLUMN_WIDTH = {
  'zh-CN': 220,
  'en-US': 318,
};

export default () => {
  const { mount, unmount, params, onPaginationChange } = usePage();
  const { loading, data, total } = useData();
  const {
    questionnaire: editing,
    onModify: onModifyQuestionnaire,
  } = useDataSet();

  const { loading: createLoading, onCreate } = useCreate();
  const { loading: modifyLoading, onModify } = useModify();
  const { loading: deleteLoading, onDelete } = useDelete();

  const table = useRef<TableRef>(null);
  const screens = Grid.useBreakpoint();

  const { t } = useTranslation('questionnaire');

  const columns: TableColumnsType<API.IQuestionnaire> = [
    {
      title: t('column.name'),
      dataIndex: 'name',
      render: (name: string, questionnaire) => (
        <Flex vertical className={styles.file}>
          <Typography.Text strong>{name}</Typography.Text>
          {screens.sm === false && (
            <>
              {questionnaire.description && (
                <Typography.Text type="secondary">{questionnaire.description}</Typography.Text>
              )}
              <Typography.Text type="secondary" className={styles.structure}>
                {t('structure', { modules: questionnaire.moduleCount, questions: questionnaire.questionCount })}
              </Typography.Text>
            </>
          )}
        </Flex>
      ),
    },
    {
      title: t('column.description'),
      dataIndex: 'description',
      responsive: ['sm'],
      render: (description: string) => (
        <Typography.Text type="secondary" className={styles.description}>
          {description}
        </Typography.Text>
      ),
    },
    {
      width: 92,
      title: t('column.moduleCount'),
      dataIndex: 'moduleCount',
      align: 'center',
      responsive: ['sm'],
    },
    {
      width: 92,
      title: t('column.questionCount'),
      dataIndex: 'questionCount',
      align: 'center',
      responsive: ['sm'],
    },
    {
      width: screens.sm ? getLocaleValue(ACTION_COLUMN_WIDTH) : 124,
      title: t('column.action'),
      dataIndex: 'uuid',
      align: 'left',
      render: (uuid: string, questionnaire) => (
        <Flex wrap gap="medium" align="center">
          <Button type="link" className={styles.action} onClick={() => onModifyQuestionnaire(questionnaire)}>
            {t('action.modify')}
          </Button>
          <Button
            type="link"
            className={styles.action}
            onClick={() => onHistoryChange('/questionnaires/questions', { uuid })}
          >
            {t('action.editQuestions')}
          </Button>
          <Button
            type="link"
            disabled={!questionnaire.questionCount}
            aria-label={t('action.answer')}
            title={t(questionnaire.questionCount ? 'action.answer' : 'message.noQuestions')}
            className={styles.action}
            onClick={() => onHistoryChange('/questionnaires/answer', { uuid })}
          >
            {t('action.answer')}
          </Button>
          <Popconfirm
            title={t('action.deleteConfirm', { name: questionnaire.name })}
            description={t('action.deleteDescription')}
            okText={t('action.delete')}
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(uuid)}
          >
            <Button danger type="link" className={styles.action}>
              {t('action.delete')}
            </Button>
          </Popconfirm>
        </Flex>
      ),
    },
  ];

  useEffect(() => {
    mount();

    return unmount;
  }, [mount, unmount]);

  useEffect(() => {
    table.current?.scrollTo({ top: 0 });
  }, [params.keyword, params.pageNum, params.pageSize]);

  useEffect(() => {
    if (!loading && data.length === 0 && total > 0 && params.pageNum > 1) {
      onPaginationChange(1, params.pageSize);
    }
  }, [loading, data, total, params, onPaginationChange]);

  return (
    <Spin
      spinning={loading || createLoading || modifyLoading || deleteLoading}
      classNames={{ root: styles.questionnaire, container: styles.container }}
    >
      <Flex vertical gap="middle" className={styles.list}>
        <Flex vertical align="start" justify="center" component="header" className={styles.cover}>
          <Flex vertical gap="small" className={styles.intro}>
            <Typography.Title level={1} className={styles.title}>
              {t('title')}
            </Typography.Title>
            {!loading && (
              <Typography.Text type="secondary">
                {total || params.keyword ? t('total', { count: total }) : t('first')}
              </Typography.Text>
            )}
          </Flex>
        </Flex>
        <SearchBar />
        <Flex vertical className={styles.body}>
          <Table<API.IQuestionnaire>
            pagination={false}
            rowKey="uuid"
            ref={table}
            columns={columns}
            dataSource={data}
            scroll={{ y: '100cqh' }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t(params.keyword ? 'noMatches' : 'empty')}
                />
              ),
            }}
            classNames={{
              section: styles.tableSection,
              header: { row: styles.tableRow },
              body: { row: styles.tableRow },
            }}
          />
        </Flex>
      </Flex>
      <Flex vertical component="footer" className={styles.footer}>
        <Pagination
          showSizeChanger
          align="end"
          total={total}
          current={params.pageNum}
          pageSize={params.pageSize}
          disabled={loading}
          className={styles.pagination}
          showTotal={showTotal}
          onChange={onPaginationChange}
        />
      </Flex>
      {editing !== undefined && (
        <QuestionnaireForm
          questionnaire={editing ?? undefined}
          loading={createLoading || modifyLoading}
          onFinish={editing ? onModify : onCreate}
        />
      )}
    </Spin>
  );
};
