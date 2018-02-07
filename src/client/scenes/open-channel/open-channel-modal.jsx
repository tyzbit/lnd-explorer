import React from 'React';
import PropTypes from 'prop-types';

import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import { OpenChannelForm } from './components/open-channel-form';
import { ModalAlert } from '../../components/modal-alert';
import { parseJson } from '../../services/rest-helpers';

export class OpenChannelModal extends React.Component {
  static propTypes = {
    resolve: PropTypes.func,
    reject: PropTypes.func,
    openPubKey: PropTypes.string,
  };

  state = {
    open: false,
    peers: undefined,
    selectedPeer: undefined,
    localAmount: 0,
    pushAmount: 0,
    valid: false,
    error: undefined,
  };

  toggle = () => {
    if (!this.state.open) this.loadPeers();
    this.setState({ open: !this.state.open, error: undefined });
  };

  ok = () => {
    let { selectedPeer, localAmount, pushAmount } = this.state;
    this.openChannel({
      target_peer_id: selectedPeer,
      local_funding_amount: localAmount,
      push_sat: pushAmount,
    })
      .then(this.toggle)
      .catch(error => this.setState({ error }));
  };

  loadPeers = () => {
    fetch('/api/peers')
      .then(res => res.json())
      .then(peers => {
        let selectedPeer = peers.peers.find(p => p.pub_key === this.props.openPubKey);
        this.setState({ peers: peers.peers, selectedPeer: selectedPeer && selectedPeer.peer_id });
      });
  };

  openChannel({ target_peer_id, local_funding_amount, push_sat }) {
    return fetch('/api/channels', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_peer_id, local_funding_amount, push_sat }),
    }).then(parseJson);
  }

  formChanged = (prop, value) => {
    let valid = this.validate({ ...this.state, [prop]: value });
    this.setState({ [prop]: value, valid });
  };

  validate = ({ selectedPeer, localAmount, pushAmount }) => {
    return selectedPeer > 0 && localAmount > 0 && pushAmount >= 0;
  };

  render() {
    let { open, peers, error, valid } = this.state;
    return (
      <div>
        <Button color="warning" size="sm" onClick={this.toggle}>
          Open channel
        </Button>
        <Modal isOpen={open} toggle={this.toggle}>
          <ModalHeader toggle={this.close}>Open channel</ModalHeader>
          <ModalBody>
            <ModalAlert error={error} />
            <OpenChannelForm peers={peers} onChange={this.formChanged} {...this.state} />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.ok} disabled={!valid}>
              Open
            </Button>
            <Button className="secondary" onClick={this.toggle}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}
