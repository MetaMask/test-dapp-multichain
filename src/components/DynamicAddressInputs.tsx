import React, { useCallback } from 'react';

type DynamicInputsProps = {
  inputArray: string[];
  setInputArray: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (inputs: string[]) => void;
};

const DynamicAddressInputs: React.FC<DynamicInputsProps> = ({
  inputArray,
  setInputArray,
  onSubmit,
}) => {
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const newInputs = [...inputArray];
      newInputs[index] = value;
      setInputArray(newInputs);
    },
    [inputArray, setInputArray],
  );

  const addInput = () => {
    if (inputArray.length < 5) {
      setInputArray([...inputArray, '']);
    }
  };

  return (
    <div>
      {inputArray.map((input, index) => (
        <div key={index}>
          <input
            type="text"
            value={input}
            onChange={(inputEvent) =>
              handleInputChange(index, inputEvent.target.value)
            }
            placeholder={`Input ${index + 1}`}
          />
          {index === inputArray.length - 1 && inputArray.length < 5 && (
            <button onClick={addInput} disabled={!input}>
              +
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onSubmit(inputArray)}>Submit</button>
    </div>
  );
};

export default DynamicAddressInputs;