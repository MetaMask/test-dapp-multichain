import React, { useCallback } from 'react';

type DynamicInputsProps = {
  inputArray: string[];
  setInputArray: React.Dispatch<React.SetStateAction<string[]>>;
};

const DynamicAddressInputs: React.FC<DynamicInputsProps> = ({
  inputArray,
  setInputArray,
}) => {
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const newInputs = [...inputArray];
      newInputs[index] = value;
      setInputArray(newInputs);
    },
    [inputArray, setInputArray],
  );

  const addInput = useCallback(() => {
    if (inputArray.length < 5) {
      setInputArray([...inputArray, '']);
    }
  }, [setInputArray, inputArray]);

  return (
    <div>
      {inputArray.map((input, index) => (
        <div key={index}>
          <label>
            Address:
            <input
              type="text"
              value={input}
              onChange={(inputEvent) =>
                handleInputChange(index, inputEvent.target.value)
              }
              placeholder="0x483b...5f97"
            />
          </label>
          {index === inputArray.length - 1 && inputArray.length < 5 && (
            <button onClick={addInput} disabled={!input}>
              +
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicAddressInputs;
