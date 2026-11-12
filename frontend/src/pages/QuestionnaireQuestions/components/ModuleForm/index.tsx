import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useCreate from '../../hooks/module/useCreate';
import useModify from '../../hooks/module/useModify';
import useModuleSet from '../../models/useModuleSet';

export default () => {
  const { module, onCancel } = useModuleSet();

  const { loading: creating, onCreate } = useCreate();
  const { loading: modifying, onModify } = useModify();

  const [form] = Form.useForm<API.IQuestionnaireModuleSetParams>();

  const { t } = useTranslation('questionnaireQuestions');

  const loading = creating || modifying;

  const onFinish = (values: API.IQuestionnaireModuleSetParams) =>
    module ? onModify(values) : onCreate(values);

  useEffect(() => {
    if (module === undefined) return;

    if (module) form.setFieldsValue({ name: module.name });
    else form.resetFields();
  }, [form, module]);

  return (
    <Modal
      destroyOnHidden
      open={module !== undefined}
      confirmLoading={loading}
      title={t(module ? 'editModule' : 'newModule')}
      okText={t('save')}
      onOk={() => form.submit()}
      onCancel={() => {
        if (!loading) onCancel();
      }}
    >
      <Form layout="vertical" form={form} disabled={loading} onFinish={onFinish}>
        <Form.Item
          name="name"
          label={t('moduleName')}
          rules={[{ required: true, whitespace: true, message: t('moduleRequired') }]}
        >
          <Input autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
};
