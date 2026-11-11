import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useDataSet from '../../models/useDataSet';

interface Props {
  questionnaire?: API.IQuestionnaire;
  loading: boolean;
  onFinish: (values: API.IQuestionnaireSetParams) => Promise<void>;
}

export default ({ questionnaire, loading, onFinish }: Props) => {
  const { onCancel } = useDataSet.getState();

  const [form] = Form.useForm<API.IQuestionnaireSetParams>();

  const { t } = useTranslation('questionnaire');

  useEffect(() => {
    if (questionnaire) form.setFieldsValue({ name: questionnaire.name, description: questionnaire.description });
    else form.resetFields();
  }, [form, questionnaire]);

  return (
    <Modal
      open
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
