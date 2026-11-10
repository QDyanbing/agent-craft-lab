import { getLocaleValue } from '@/i18n';
import { onHistoryChange } from '@/utils/history';
import { showTotal } from '@/utils/pagination';
import {
  Button,
  Empty,
  Flex,
  Grid,
  Pagination,
  Popconfirm,
  Result,
  Spin,
  Table,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuestionnaireForm from './components/QuestionnaireForm';
import SearchBar from './components/SearchBar';
import useCreate from './hooks/useCreate';
import useDelete from './hooks/useDelete';
import useModify from './hooks/useModify';
import styles from './index.module.less';
import useData from './models/useData';
import useDialog from './models/useDialog';
import usePage from './models/usePage';

export default () => {
  const { mount, unmount, params, onPaginationChange } = usePage();
  const { loading, data, total, hasError, onRefresh } = useData();
  const { dialog, onOpen } = useDialog();

  const { loading: creating, onCreate } = useCreate();
  const { loading: modifying, onModify } = useModify();
  const { loading: deleting, onDelete } = useDelete();

  const screens = Grid.useBreakpoint();

  const { t } = useTranslation('questionnaire');

  const columns: TableColumnsType<API.QuestionnaireSummary> = [
    {
      title: t('name'),
      dataIndex: 'name',
      render: (name: string, survey) => (
        <Flex vertical className={styles.file}>
          <Typography.Text strong>{name}</Typography.Text>
          {screens.sm === false && (
            <>
              {survey.description && (
                <Typography.Text type="secondary">{survey.description}</Typography.Text>
              )}
              <Typography.Text type="secondary" className={styles.structure}>
                {t('structure', { modules: survey.moduleCount, questions: survey.questionCount })}
              </Typography.Text>
            </>
          )}
        </Flex>
      ),
    },
    {
      title: t('description'),
      dataIndex: 'description',
      responsive: ['sm'],
      render: (description: string) => (
        <Typography.Text type="secondary" className={styles.description}>
          {description}
        </Typography.Text>
      ),
    },
    {
      title: t('moduleCount'),
      dataIndex: 'moduleCount',
      align: 'center',
      width: 92,
      responsive: ['sm'],
    },
    {
      title: t('questionCount'),
      dataIndex: 'questionCount',
      align: 'center',
      width: 92,
      responsive: ['sm'],
    },
    {
      title: t('actions'),
      dataIndex: 'uuid',
      align: 'left',
      width: screens.sm ? getLocaleValue({ 'zh-CN': 220, 'en-US': 294 }) : 124,
      render: (uuid: string, survey) => (
        <Flex wrap align="center" gap="small">
          <Button type="link" className={styles.action} onClick={() => onOpen(survey)}>
            {t('edit')}
          </Button>
          <Button
            type="link"
            className={styles.action}
            onClick={() => onHistoryChange('/questionnaires/edit', { uuid })}
          >
            {t('editQuestions')}
          </Button>
          <Button
            type="link"
            disabled={!survey.questionCount}
            aria-label={t('answer')}
            title={t(survey.questionCount ? 'answer' : 'noQuestions')}
            className={styles.action}
            onClick={() => onHistoryChange('/questionnaires/answer', { uuid })}
          >
            {t('answer')}
          </Button>
          <Popconfirm
            title={t('deleteConfirm', { name: survey.name })}
            description={t('deleteDescription')}
            okText={t('delete')}
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(uuid)}
          >
            <Button danger type="link" className={styles.action}>
              {t('delete')}
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

  return (
    <Spin
      spinning={loading || creating || modifying || deleting}
      classNames={{ root: styles.questionnaire, container: styles.container }}
    >
      <Flex vertical gap="middle" className={styles.list}>
        <SearchBar total={loading || hasError ? undefined : total} />
        <Flex vertical className={styles.body} data-error={hasError}>
          {hasError ? (
            <Result
              status="warning"
              title={t('loadError')}
              extra={<Button onClick={onRefresh}>{t('retry')}</Button>}
            />
          ) : (
            <Table<API.QuestionnaireSummary>
              key={JSON.stringify([params.keyword, params.pageNum, params.pageSize])}
              pagination={false}
              rowKey="uuid"
              columns={columns}
              dataSource={data}
              scroll={{ y: '100cqh' }}
              classNames={{ section: styles.tableSection }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t(params.keyword ? 'noMatches' : 'empty')}
                  />
                ),
              }}
            />
          )}
        </Flex>
      </Flex>
      {!hasError && (
        <Flex vertical component="footer" className={styles.footer}>
          <Pagination
            showSizeChanger
            align="end"
            current={params.pageNum}
            disabled={loading}
            pageSize={params.pageSize}
            total={total}
            className={styles.pagination}
            showTotal={showTotal}
            onChange={onPaginationChange}
          />
        </Flex>
      )}
      {dialog && (
        <QuestionnaireForm
          survey={dialog.survey}
          loading={creating || modifying}
          onFinish={dialog.survey ? onModify : onCreate}
        />
      )}
    </Spin>
  );
};
