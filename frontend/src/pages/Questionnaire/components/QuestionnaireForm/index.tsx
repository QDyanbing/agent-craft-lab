import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useCreate from '../../hooks/useCreate';
import useModify from '../../hooks/useModify';
import useDataSet from '../../models/useDataSet';

export default () => {
  const { questionnaire, onCancel } = useDataSet();

  const { loading: creating, onCreate } = useCreate();
  const { loading: modifying, onModify } = useModify();

  const [form] = Form.useForm<API.IQuestionnaireSetParams>();

  const { t } = useTranslation('questionnaire');

  const loading = creating || modifying;

  const onFinish = (values: API.IQuestionnaireSetParams) =>
    questionnaire ? onModify(values) : onCreate(values);

  useEffect(() => {
    if (questionnaire === undefined) return;

    if (questionnaire) {
      form.setFieldsValue({ name: questionnaire.name, description: questionnaire.description });
    } else {
      form.resetFields();
    }
  }, [form, questionnaire]);

  return (
    <Modal
      destroyOnHidden
      open={questionnaire !== undefined}
      confirmLoading={loading}
      title={t(questionnaire ? 'form.editTitle' : 'action.create')}
      okText={t(questionnaire ? 'form.save' : 'form.submit')}
      onOk={() => form.submit()}
      onCancel={() => {
        if (!loading) onCancel();
      }}
    >
      <Form layout="vertical" form={form} disabled={loading} onFinish={onFinish}>
        <Form.Item
          name="name"
          label={t('column.name')}
          rules={[{ required: true, whitespace: true, message: t('form.nameRequired') }]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="description" label={t('column.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
