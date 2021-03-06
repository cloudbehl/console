import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';

export const RadioInput = (props) => {
  const inputProps = _.omit(props, ['title', 'subTitle', 'desc', 'children', 'inline']);
  const labelClass = props.inline ? 'radio-inline' : '';
  const inputElement = <React.Fragment>
    <label className={labelClass}>
      <input type="radio" {...inputProps} />
      {props.title} {props.subTitle && <span className="co-no-bold">{props.subTitle}</span>}
    </label>
    {props.desc && <p className="co-m-radio-desc text-muted">{props.desc}</p>}
    {props.children}
  </React.Fragment>;

  return props.inline ? inputElement : <div className="radio">{inputElement}</div>;

};

RadioInput.propTypes = {
  children: PropTypes.node,
  desc: PropTypes.node,
  title: PropTypes.node.isRequired,
  inline?: PropTypes.bool,
};

export const RadioGroup = ({currentValue, onChange, items}) => <div>
  {items.map(({desc, title, value}) => <RadioInput
    key={value}
    checked={value === currentValue}
    desc={desc}
    onChange={onChange}
    title={title}
    value={value}
  />)}
</div>;
