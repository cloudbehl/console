import * as React from 'react';
import * as _ from 'lodash';

import { RequestSizeInput } from '@console/internal/components/utils/index';
import { withHandlePromise } from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory';

import './_add-capacity-modal.scss';

export const AddCapacityModal = withHandlePromise((props: AddCapacityModelProps) => {
  const { kind, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const dropdownUnits = {
    TiB: 'TiB',
  };
  const [requestSizeUnit, setRequestSizeUnit] = React.useState(dropdownUnits.TiB);
  const [requestSizeValue, setRequestSizeValue] = React.useState("1");
  const [storageClass, setStorageClass] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
  };

  const handleRequestSizeInputChange = obj => {
    setRequestSizeUnit(obj.unit);
    setRequestSizeValue(obj.value);
  };

  const handleStorageClass = storageClass => {
    setStorageClass(_.get(storageClass, 'metadata.name'));
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>Add Capacity</ModalTitle>
      <ModalBody>
        Increase the capacity of <strong>{kind}</strong>.
        <div className="add-capacity-model__padding">
          <div className="form-group">
            <label className="control-label" htmlFor="request-size-input">
              Requested Capacity
          </label>
            <RequestSizeInput
              name="requestSize"
              required={true}
              placeholder={requestSizeValue}
              onChange={handleRequestSizeInputChange}
              defaultRequestSizeUnit={requestSizeUnit}
              defaultRequestSizeValue={requestSizeValue}
              dropdownUnits={dropdownUnits}
              describedBy="request-size-help"
            />
          </div>
          <StorageClassDropdown
            onChange={handleStorageClass}
            id="storageclass-dropdown"
            required={false}
            name="storageClass"
          />
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Add"
        cancel={cancel}
      />
    </form>
  );
});

export type AddCapacityModelProps = {
  kind?: any;
  obj?: any
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

export const addCapacityModal = createModalLauncher(AddCapacityModal);

