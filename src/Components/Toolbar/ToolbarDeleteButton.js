import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Alert, Badge, Button, Tooltip } from '@patternfly/react-core';
import AlertModal from '../AlertModal';

import { getRelatedResourceDeleteCounts } from '../../Utilities/getRelatedResourceDeleteDetails';

import ErrorDetail from '../ErrorDetail';

const WarningMessage = styled(Alert)`
  margin-top: 10px;
`;

const Label = styled.span`
  && {
    margin-right: 10px;
  }
`;

const requiredField = (props) => {
  const { name, username, image } = props;
  if (!name && !username && !image) {
    return new Error(
      `One of 'name', 'username' or 'image' is required by ItemToDelete component.`
    );
  }
  if (name) {
    PropTypes.checkPropTypes(
      {
        name: PropTypes.string,
      },
      { name: props.name },
      'prop',
      'ItemToDelete'
    );
  }
  if (username) {
    PropTypes.checkPropTypes(
      {
        username: PropTypes.string,
      },
      { username: props.username },
      'prop',
      'ItemToDelete'
    );
  }
  if (image) {
    PropTypes.checkPropTypes(
      {
        image: PropTypes.string,
      },
      { image: props.image },
      'prop',
      'ItemToDelete'
    );
  }
  return null;
};

const ItemToDelete = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: requiredField,
  username: requiredField,
  image: requiredField,
});

const ToolbarDeleteButton = ({
  itemsToDelete,
  pluralizedItemName = 'Items',
  errorMessage,
  onDelete,
  warningMessage = null,
  deleteDetailsRequests,
  deleteMessage,
  cannotDelete = (item) => !item,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDetails, setDeleteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [deleteMessageError, setDeleteMessageError] = useState();
  const handleDelete = () => {
    onDelete();
    toggleModal();
  };

  const toggleModal = async (isOpen) => {
    setIsLoading(true);
    setDeleteDetails(null);
    if (
      isOpen &&
      itemsToDelete.length === 1 &&
      deleteDetailsRequests?.length > 0
    ) {
      const { results, error } = await getRelatedResourceDeleteCounts(
        deleteDetailsRequests
      );

      if (error) {
        setDeleteMessageError(error);
      } else {
        setDeleteDetails(results);
      }
    }
    setIsLoading(false);
    setIsModalOpen(isOpen);
  };

  const renderTooltip = () => {
    const itemsUnableToDelete = itemsToDelete
      .filter(cannotDelete)
      .map((item) => item.name || item.username)
      .join(', ');

    if (itemsToDelete.some(cannotDelete)) {
      return (
        <div>
          {errorMessage ? (
            <>
              <span>{errorMessage}</span>
              <span>{`: ${itemsUnableToDelete}`}</span>
            </>
          ) : (
            `You do not have permission to delete ${pluralizedItemName}: ${itemsUnableToDelete}`
          )}
        </div>
      );
    }
    if (itemsToDelete.length) {
      return 'Delete';
    }
    return 'Select a plan to delete';
  };

  const modalTitle = `Delete ${pluralizedItemName}?`;

  const isDisabled =
    itemsToDelete.length === 0 || itemsToDelete.some(cannotDelete);

  const buildDeleteWarning = () => {
    const deleteMessages = [];
    if (warningMessage) {
      deleteMessages.push(warningMessage);
    }
    if (deleteMessage) {
      if (deleteDetails || itemsToDelete.length > 1) {
        deleteMessages.push(deleteMessage);
      }
    }

    return (
      <div>
        {deleteMessages.map((message) => (
          <div aria-label={message} key={message}>
            {message}
          </div>
        ))}
        {deleteDetails &&
          Object.entries(deleteDetails).map(([key, value]) => (
            <div key={key} aria-label={`${key}: ${value}`}>
              <Label>{key}</Label>
              <Badge>{value}</Badge>
            </div>
          ))}
      </div>
    );
  };

  const shouldShowDeleteWarning =
    warningMessage ||
    (itemsToDelete.length === 1 && deleteDetails) ||
    (itemsToDelete.length > 1 && deleteMessage);

  if (deleteMessageError) {
    return (
      <AlertModal
        isOpen={deleteMessageError}
        title={'Error!'}
        onClose={() => {
          toggleModal(false);
          setDeleteMessageError();
        }}
      >
        <ErrorDetail error={deleteMessageError} />
      </AlertModal>
    );
  }

  return (
    <>
      <Tooltip content={renderTooltip()} position="top">
        <div>
          <Button
            variant="secondary"
            ouiaId="delete-button"
            spinnerAriaValueText={isLoading ? 'Loading' : undefined}
            aria-label={'Delete'}
            onClick={() => toggleModal(true)}
            isDisabled={isDisabled}
          >
            {'Delete'}
          </Button>
        </div>
      </Tooltip>

      {isModalOpen && (
        <AlertModal
          variant="danger"
          title={modalTitle}
          isOpen={isModalOpen}
          onClose={() => toggleModal(false)}
          actions={[
            <Button
              ouiaId="delete-modal-confirm"
              key="delete"
              variant="danger"
              aria-label={'confirm delete'}
              isDisabled={Boolean(deleteDetails)}
              onClick={handleDelete}
            >
              {'Delete'}
            </Button>,
            <Button
              key="cancel"
              variant="link"
              aria-label={'cancel delete'}
              onClick={() => toggleModal(false)}
            >
              {'Cancel'}
            </Button>,
          ]}
        >
          <div>{'This action will delete the following:'}</div>
          {itemsToDelete.map((item) => (
            <span key={item.id}>
              <strong>{item.name || item.username || item.image}</strong>
              <br />
            </span>
          ))}
          {shouldShowDeleteWarning && (
            <WarningMessage
              variant="warning"
              isInline
              title={buildDeleteWarning()}
            />
          )}
        </AlertModal>
      )}
    </>
  );
};

// TODO Harpreet Kataria I was not able to figure out the exact type of the
// deleteDetailsRequests. Cna you please fill in?
// Same for the delete message
ToolbarDeleteButton.propTypes = {
  itemsToDelete: PropTypes.arrayOf(ItemToDelete).isRequired,
  pluralizedItemName: PropTypes.string,
  errorMessage: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  warningMessage: PropTypes.node,
  deleteDetailsRequests: PropTypes.array.isRequired,
  cannotDelete: PropTypes.func,
  deleteMessage: PropTypes.object.isRequired,
};

export default ToolbarDeleteButton;
