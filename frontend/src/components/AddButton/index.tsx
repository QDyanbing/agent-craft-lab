import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface Props {
  label: string;
  onClick: () => void;
}

export default ({ label, onClick }: Props) => (
  <Button type="text" title={label} aria-label={label} icon={<PlusOutlined />} onClick={onClick} />
);
