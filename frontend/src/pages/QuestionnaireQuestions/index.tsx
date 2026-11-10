import useUrlState from '@/hooks/useUrlState';
import { Empty, Spin } from 'antd';
import { useEffect } from 'react';
import Editor from './components/Editor';
import useDeleteModule from './hooks/module/useDelete';
import useDeleteQuestion from './hooks/question/useDelete';
import styles from './index.module.less';
import useDetail from './models/useDetail';
import usePage from './models/usePage';

export default () => {
  const { uuid: currentUuid, mount, unmount } = usePage();
  const { loading, data } = useDetail();

  const { loading: deletingModule, onDelete: onDeleteModule } = useDeleteModule();
  const { loading: deletingQuestion, onDelete: onDeleteQuestion } = useDeleteQuestion();

  const [{ uuid }] = useUrlState<{ uuid: string }>();

  const isLoading = loading || uuid !== currentUuid;

  useEffect(() => {
    mount(uuid);

    return unmount;
  }, [mount, unmount, uuid]);

  return (
    <Spin
      spinning={isLoading || deletingModule || deletingQuestion}
      classNames={{ root: styles.questionnaireQuestions, container: styles.container }}
    >
      {data && data.uuid === uuid ? (
        <Editor
          key={uuid}
          survey={data}
          onDeleteModule={onDeleteModule}
          onDeleteQuestion={onDeleteQuestion}
        />
      ) : (
        !isLoading && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Spin>
  );
};
