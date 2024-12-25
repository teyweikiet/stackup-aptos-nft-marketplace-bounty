import { Space, Slider } from "antd";

const transformPriceRangeValue = (value: number) => 10**value

interface PriceSliderProps {
  onChangeComplete: (value: number[]) => void;
}

const PriceSlider: React.FC<PriceSliderProps> = ({ onChangeComplete }) => {
  return (
    <Space
      style={{
        border: '1px solid #d9d9d9',
        background: '#fff',
        borderRadius: '6px',
        padding: '0 11px',
        height: '32px'
      }}
    >
      Price
      <Slider
        range
        min={-3}
        max={2}
        step={0.1}
        style={{ width: '150px' }}
        defaultValue={[-3, 2]}
        onChangeComplete={(value: number[]) => {
          onChangeComplete(value.map(transformPriceRangeValue));
        }}
        tooltip={{
          formatter: (value?: number) => {
            if (typeof value === 'undefined') {
              return '';
            }
            else if (value < 0) {
              return `${transformPriceRangeValue(value).toPrecision(1)}`;
            }
            else {
              return `${transformPriceRangeValue(value).toFixed(0)}`;
            }
          },
        }}
      />
    </Space>
  )
}

export default PriceSlider;