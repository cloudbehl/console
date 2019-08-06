import * as React from 'react';
import { TextArea } from '@patternfly/react-core';
import { HandlePromiseProps, withHandlePromise } from '@console/internal/components/utils';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { VMLikeEntityKind } from 'packages/kubevirt-plugin/src/types';
import { getDescription, getVMLikeModel } from '/home/kmurarka/ocs/console/frontend/packages/kubevirt-plugin/src/selectors/selectors';
import { getUpdateDescriptionPatches } from '/home/kmurarka/ocs/console/frontend/packages/kubevirt-plugin/src/k8s/patches/vm/vm-patches';

import './_add-capacity-modal.scss';

export const AddCapacityModel = withHandlePromise((props: AddCapacityModelProps) => {
  const { kind, inProgress, errorMessage, handlePromise, close, cancel } = props;

  const [description, setDescription] = React.useState(getDescription(kind));

  const submit = (e) => {
    e.preventDefault();

  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>Add Capacity</ModalTitle>
      <ModalBody>
        
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText="Save"
        cancel={cancel}
      />
    </form>
  );
});

export type AddCapacityModelProps = HandlePromiseProps &
  ModalComponentProps & {
    kind: any;
  };

export const addCapacityModel = createModalLauncher(AddCapacityModel);
