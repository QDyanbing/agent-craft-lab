import { getLocaleValue } from '@/i18n';
import { onHistoryChange } from '@/utils/history';
import { showTotal } from '@/utils/pagination';
import type { TableColumnsType } from 'antd';
import { Button, Flex, Pagination, Popconfirm, Spin, Table, Typography } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionnaireForm from './components/QuestionnaireForm';
import SearchBar from './components/SearchBar';
import useDelete from './hooks/useDelete';
import styles from './index.module.less';
import useData from './models/useData';
import useDataSet from './models/useDataSet';
import usePage from './models/usePage';

const ACTION_COLUMN_WIDTH = { 'zh-CN': 220, 'en-US': 320 };

export default () => {
  const { params, onPaginationChange, mount, unmount } = usePage();
  const { loading, data, total } = useData();
  const { onModify } = useDataSet();

  const { loading: deleteLoading, onDelete } = useDelete();

  const { t } = useTranslation('questionnaire');

  const columns: TableColumnsType<API.IQuestionnaire> = [
    {
      title: t('column.name'),
      dataIndex: 'name',
    },
    {
      title: t('column.description'),
      dataIndex: 'description',
    },
    {
      width: 100,
      title: t('column.moduleCount'),
      dataIndex: 'moduleCount',
      align: 'center',
    },
    {
      width: 120,
      title: t('column.questionCount'),
      dataIndex: 'questionCount',
      align: 'center',
    },
    {
      width: getLocaleValue(ACTION_COLUMN_WIDTH),
      title: t('column.action'),
      dataIndex: 'uuid',
      align: 'left',
      render: (uuid: string, questionnaire) => (
        <Flex gap="medium" align="center">
          <Button type="link" className={styles.action} onClick={() => onModify(questionnaire)}>
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
  }, []);

  return (
    <Spin
      spinning={loading || deleteLoading}
      classNames={{ root: styles.questionnaire, container: styles.container }}
    >
      <Flex
        vertical
        gap="small"
        align="start"
        justify="center"
        component="header"
        className={styles.header}
      >
        <Typography.Title level={3}>{t('title')}</Typography.Title>
        <Typography.Text type="secondary">{t('total', { count: total ?? 0 })}</Typography.Text>
      </Flex>
      <SearchBar />
      <Table<API.IQuestionnaire>
        sticky
        pagination={false}
        rowKey="uuid"
        columns={columns}
        dataSource={data}
        className={styles.body}
      />
      <Pagination
        showSizeChanger
        align="end"
        total={total}
        current={params.pageNum}
        pageSize={params.pageSize}
        disabled={loading}
        showTotal={showTotal}
        onChange={onPaginationChange}
      />
      <QuestionnaireForm />
    </Spin>
  );
};
