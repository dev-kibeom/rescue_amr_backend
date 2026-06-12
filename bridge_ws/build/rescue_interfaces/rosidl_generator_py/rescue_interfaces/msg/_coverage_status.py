# generated from rosidl_generator_py/resource/_idl.py.em
# with input from rescue_interfaces:msg/CoverageStatus.idl
# generated code does not contain a copyright notice


# Import statements for member types

import builtins  # noqa: E402, I100

import math  # noqa: E402, I100

import rosidl_parser.definition  # noqa: E402, I100


class Metaclass_CoverageStatus(type):
    """Metaclass of message 'CoverageStatus'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('rescue_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'rescue_interfaces.msg.CoverageStatus')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__msg__coverage_status
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__msg__coverage_status
            cls._CONVERT_TO_PY = module.convert_to_py_msg__msg__coverage_status
            cls._TYPE_SUPPORT = module.type_support_msg__msg__coverage_status
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__msg__coverage_status

            from geometry_msgs.msg import PoseStamped
            if PoseStamped.__class__._TYPE_SUPPORT is None:
                PoseStamped.__class__.__import_type_support__()

            from std_msgs.msg import Header
            if Header.__class__._TYPE_SUPPORT is None:
                Header.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class CoverageStatus(metaclass=Metaclass_CoverageStatus):
    """Message class 'CoverageStatus'."""

    __slots__ = [
        '_header',
        '_mode',
        '_state',
        '_total_goals',
        '_visited_goals',
        '_coverage_ratio',
        '_current_goal',
        '_message',
    ]

    _fields_and_field_types = {
        'header': 'std_msgs/Header',
        'mode': 'string',
        'state': 'string',
        'total_goals': 'uint32',
        'visited_goals': 'uint32',
        'coverage_ratio': 'float',
        'current_goal': 'geometry_msgs/PoseStamped',
        'message': 'string',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.NamespacedType(['std_msgs', 'msg'], 'Header'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.BasicType('uint32'),  # noqa: E501
        rosidl_parser.definition.BasicType('uint32'),  # noqa: E501
        rosidl_parser.definition.BasicType('float'),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['geometry_msgs', 'msg'], 'PoseStamped'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        from std_msgs.msg import Header
        self.header = kwargs.get('header', Header())
        self.mode = kwargs.get('mode', str())
        self.state = kwargs.get('state', str())
        self.total_goals = kwargs.get('total_goals', int())
        self.visited_goals = kwargs.get('visited_goals', int())
        self.coverage_ratio = kwargs.get('coverage_ratio', float())
        from geometry_msgs.msg import PoseStamped
        self.current_goal = kwargs.get('current_goal', PoseStamped())
        self.message = kwargs.get('message', str())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.header != other.header:
            return False
        if self.mode != other.mode:
            return False
        if self.state != other.state:
            return False
        if self.total_goals != other.total_goals:
            return False
        if self.visited_goals != other.visited_goals:
            return False
        if self.coverage_ratio != other.coverage_ratio:
            return False
        if self.current_goal != other.current_goal:
            return False
        if self.message != other.message:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def header(self):
        """Message field 'header'."""
        return self._header

    @header.setter
    def header(self, value):
        if __debug__:
            from std_msgs.msg import Header
            assert \
                isinstance(value, Header), \
                "The 'header' field must be a sub message of type 'Header'"
        self._header = value

    @builtins.property
    def mode(self):
        """Message field 'mode'."""
        return self._mode

    @mode.setter
    def mode(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'mode' field must be of type 'str'"
        self._mode = value

    @builtins.property
    def state(self):
        """Message field 'state'."""
        return self._state

    @state.setter
    def state(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'state' field must be of type 'str'"
        self._state = value

    @builtins.property
    def total_goals(self):
        """Message field 'total_goals'."""
        return self._total_goals

    @total_goals.setter
    def total_goals(self, value):
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'total_goals' field must be of type 'int'"
            assert value >= 0 and value < 4294967296, \
                "The 'total_goals' field must be an unsigned integer in [0, 4294967295]"
        self._total_goals = value

    @builtins.property
    def visited_goals(self):
        """Message field 'visited_goals'."""
        return self._visited_goals

    @visited_goals.setter
    def visited_goals(self, value):
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'visited_goals' field must be of type 'int'"
            assert value >= 0 and value < 4294967296, \
                "The 'visited_goals' field must be an unsigned integer in [0, 4294967295]"
        self._visited_goals = value

    @builtins.property
    def coverage_ratio(self):
        """Message field 'coverage_ratio'."""
        return self._coverage_ratio

    @coverage_ratio.setter
    def coverage_ratio(self, value):
        if __debug__:
            assert \
                isinstance(value, float), \
                "The 'coverage_ratio' field must be of type 'float'"
            assert not (value < -3.402823466e+38 or value > 3.402823466e+38) or math.isinf(value), \
                "The 'coverage_ratio' field must be a float in [-3.402823466e+38, 3.402823466e+38]"
        self._coverage_ratio = value

    @builtins.property
    def current_goal(self):
        """Message field 'current_goal'."""
        return self._current_goal

    @current_goal.setter
    def current_goal(self, value):
        if __debug__:
            from geometry_msgs.msg import PoseStamped
            assert \
                isinstance(value, PoseStamped), \
                "The 'current_goal' field must be a sub message of type 'PoseStamped'"
        self._current_goal = value

    @builtins.property
    def message(self):
        """Message field 'message'."""
        return self._message

    @message.setter
    def message(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'message' field must be of type 'str'"
        self._message = value
