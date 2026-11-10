import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useCreate from '../../hooks/module/useCreate';
import useModify from '../../hooks/module/useModify';
import useEditor from '../../models/useEditor';

export default ({ module }: { module?: API.QuestionnaireModule }) => {
  const { onClose } = useEditor.getState();

  const { loading: creating, onCreate } = useCreate();
  const { loading: modifying, onModify } = useModify();

  const [form] = Form.useForm<API.QuestionnaireModuleSetParams>();

  const { t } = useTranslation('questionnaireEdit');

  const loading = creating || modifying;

  const onFinish = (values: API.QuestionnaireModuleSetParams) =>
    module ? onModify(values) : onCreate(values);

  useEffect(() => {
    if (module) form.setFieldsValue({ name: module.name });
    else form.resetFields();
  }, [form, module]);

  return (
    <Modal
      open
      title={t(module ? 'editModule' : 'newModule')}
      confirmLoading={loading}
      okText={t('save')}
      onOk={() => form.submit()}
      onCancel={() => {
        if (!loading) onClose();
      }}
    >
      <Form layout="vertical" disabled={loading} form={form} onFinish={onFinish}>
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
